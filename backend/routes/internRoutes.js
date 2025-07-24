const express = require('express');
const db = require('../db');
const { protect } = require('../middleware/authMiddleware');
const { sendBookingConfirmation, sendCancellationNotice } = require('../utils/emailService'); // Correctly import email functions
const router = express.Router();

// ---
// @route   GET api/intern/seats
// @desc    Get available seats for a specific date
// @access  Private (Intern)
// ---
router.get('/seats', protect, async (req, res) => {
    const { date } = req.query; // date in 'YYYY-MM-DD' format
    if (!date) {
        return res.status(400).json({ message: 'Date query parameter is required' });
    }

    try {
        const query = `
            SELECT s.id, s.seat_number, s.location_area
            FROM seats s
            WHERE s.id NOT IN (
                SELECT r.seat_id FROM reservations r
                WHERE r.reservation_date = $1 AND r.status = 'Active'
            )
            ORDER BY s.seat_number;
        `;
        const { rows } = await db.query(query, [date]);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching available seats:", error);
        res.status(500).json({ message: 'Server error while fetching seats' });
    }
});

// ---
// @route   POST api/intern/reservations
// @desc    Book/reserve a seat
// @access  Private (Intern)
// ---
router.post('/reservations', protect, async (req, res) => {
    const { seat_id, reservation_date } = req.body;
    const intern_id = req.user.id;

    // Validation Rules
    const bookingTime = new Date(`${reservation_date}T00:00:00`);
    const now = new Date();
    if (bookingTime < now.setHours(0,0,0,0)) {
         return res.status(400).json({ message: 'Past dates cannot be booked.' });
    }

    try {
        // Step 1: Insert the new reservation
        const query = 'INSERT INTO reservations (intern_id, seat_id, reservation_date) VALUES ($1, $2, $3) RETURNING *';
        const { rows } = await db.query(query, [intern_id, seat_id, reservation_date]);
        const newReservation = rows[0];

        // Step 2: Fetch seat details for the email
        const seatQuery = await db.query('SELECT * FROM seats WHERE id = $1', [seat_id]);
        const seatDetails = seatQuery.rows[0];

        // Step 3: Send confirmation email (don't wait for it to complete)
        if (seatDetails) {
            sendBookingConfirmation(req.user, newReservation, seatDetails);
        }
        
        // Step 4: Respond to the client immediately
        res.status(201).json(newReservation);

    } catch (error) {
        // Check for unique constraint violation (double booking)
        if (error.code === '23505') { 
            return res.status(409).json({ message: 'This seat is already booked for this date, or you already have a booking on this day.' });
        }
        console.error("Error booking seat:", error);
        res.status(500).json({ message: 'Server error during booking process' });
    }
});

// ---
// @route   GET api/intern/reservations
// @desc    View current and past reservations for the logged-in intern
// @access  Private (Intern)
// ---
router.get('/reservations', protect, async (req, res) => {
    try {
        const query = `
            SELECT r.id, r.reservation_date, r.status, s.seat_number, s.location_area
            FROM reservations r
            JOIN seats s ON r.seat_id = s.id
            WHERE r.intern_id = $1
            ORDER BY r.reservation_date DESC;
        `;
        const { rows } = await db.query(query, [req.user.id]);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching user reservations:", error);
        res.status(500).json({ message: 'Server error while fetching reservations' });
    }
});

// ---
// @route   PUT api/intern/reservations/:id/cancel
// @desc    Cancel a future reservation
// @access  Private (Intern)
// ---
router.put('/reservations/:id/cancel', protect, async (req, res) => {
    try {
        // Step 1: Update the reservation status
        const updateQuery = `
            UPDATE reservations SET status = 'Cancelled'
            WHERE id = $1 AND intern_id = $2 AND reservation_date >= CURRENT_DATE
            RETURNING *
        `;
        const { rows } = await db.query(updateQuery, [req.params.id, req.user.id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Reservation not found or it cannot be cancelled (e.g., it is in the past).' });
        }
        const cancelledReservation = rows[0];

        // Step 2: Fetch seat details for the email
        const seatQuery = await db.query('SELECT * FROM seats WHERE id = $1', [cancelledReservation.seat_id]);
        const seatDetails = seatQuery.rows[0];

        // Step 3: Send cancellation email
        if (seatDetails) {
            sendCancellationNotice(req.user, cancelledReservation, seatDetails);
        }

        // Step 4: Respond to the client
        res.json({ message: 'Reservation cancelled successfully.', reservation: cancelledReservation });

    } catch (error) {
        console.error("Error cancelling reservation:", error);
        res.status(500).json({ message: 'Server error while cancelling reservation' });
    }
});

module.exports = router;