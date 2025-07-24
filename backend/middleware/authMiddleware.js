const jwt = require('jsonwebtoken');
const db = require('../db');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user to the request object (without password)
            const { rows } = await db.query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
            if (rows.length === 0) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            req.user = rows[0];
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, admin };