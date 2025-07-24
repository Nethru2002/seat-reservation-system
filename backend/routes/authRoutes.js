const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

// Register a new user (intern)
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    // Constraint: Only interns with valid office email addresses
    if (!email.endsWith('@office.com')) { // Example office domain
        return res.status(400).json({ message: 'Invalid email domain. Please use your office email.' });
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const { rows } = await db.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, role',
            [name, email, hashedPassword]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;