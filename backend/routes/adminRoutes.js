const express = require('express');
const db = require('../db');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(protect, admin);

// --- NEW: Dashboard Stats Endpoint ---
router.get('/stats', async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        const totalSeatsQuery = db.query('SELECT COUNT(*) FROM seats');
        const bookedTodayQuery = db.query("SELECT COUNT(*) FROM reservations WHERE reservation_date = $1 AND status = 'Active'", [today]);
        
        const [totalSeatsRes, bookedTodayRes] = await Promise.all([totalSeatsQuery, bookedTodayQuery]);
        
        const totalSeats = parseInt(totalSeatsRes.rows[0].count, 10);
        const bookedToday = parseInt(bookedTodayRes.rows[0].count, 10);
        
        const utilization = totalSeats > 0 ? ((bookedToday / totalSeats) * 100).toFixed(0) : 0;

        res.json({
            totalSeats,
            bookedToday,
            utilization,
        });
    } catch (error) {
        console.error("Admin: Error fetching stats:", error);
        res.status(500).json({ message: 'Server error while fetching dashboard stats' });
    }
});

// --- NEW: Chart Data Endpoint ---
router.get('/reports/usage-by-day', async (req, res) => {
    try {
        const query = `
            SELECT 
                to_char(reservation_date, 'YYYY-MM-DD') as date, 
                COUNT(*) as count
            FROM reservations
            WHERE 
                reservation_date >= CURRENT_DATE - INTERVAL '6 days' 
                AND reservation_date <= CURRENT_DATE
                AND status = 'Active'
            GROUP BY date
            ORDER BY date ASC;
        `;
        const { rows } = await db.query(query);
        
        // Prepare data for Chart.js
        const labels = [];
        const data = [];
        const dateMap = new Map(rows.map(row => [row.date, parseInt(row.count, 10)]));

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().slice(0, 10);
            labels.push(dateString);
            data.push(dateMap.get(dateString) || 0);
        }

        res.json({ labels, data });
    } catch (error) {
        console.error("Admin: Error fetching chart data:", error);
        res.status(500).json({ message: 'Server error while fetching chart data' });
    }
});


// --- Existing Routes (No changes needed) ---
router.post('/seats', async (req, res) => {
    const { seat_number, location_area } = req.body;
    try {
        const { rows } = await db.query('INSERT INTO seats (seat_number, location_area) VALUES ($1, $2) RETURNING *', [seat_number, location_area]);
        res.status(201).json(rows[0]);
    } catch (error) { console.error("Admin: Error adding seat:", error); res.status(500).json({ message: 'Server error while adding seat' }); }
});

router.get('/seats', async (req, res) => {
     try {
        const { rows } = await db.query('SELECT * FROM seats ORDER BY id');
        res.json(rows);
    } catch (error) { console.error("Admin: Error fetching seats:", error); res.status(500).json({ message: 'Server error while fetching seats' }); }
});

router.delete('/seats/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM seats WHERE id = $1', [req.params.id]);
        res.json({ message: 'Seat deleted successfully' });
    } catch (error) { console.error("Admin: Error deleting seat:", error); res.status(500).json({ message: 'Server error while deleting seat' }); }
});

router.get('/reservations', async (req, res) => {
    try {
        const query = `
            SELECT r.id, r.reservation_date, r.status, u.name AS intern_name, u.email AS intern_email, s.seat_number, s.location_area
            FROM reservations r JOIN users u ON r.intern_id = u.id JOIN seats s ON r.seat_id = s.id
            ORDER BY r.reservation_date DESC, u.name;
        `;
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (error) { console.error("Admin: Error fetching all reservations:", error); res.status(500).json({ message: 'Server error while fetching reservations.' }); }
});

module.exports = router;