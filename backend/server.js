const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const internRoutes = require('./routes/internRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // for parsing application/json

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/intern', internRoutes);
app.use('/api/admin', adminRoutes);

// Test Route
app.get('/', (req, res) => {
    res.send('Seat Reservation System API is running...');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});