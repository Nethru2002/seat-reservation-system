const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendBookingConfirmation = async (user, reservation, seat) => {
    const mailOptions = {
        from: '"Seat Reservation System" <noreply@seat-reservation.com>',
        to: user.email,
        subject: 'Your Seat Reservation is Confirmed!',
        html: `
            <h1>Booking Confirmed!</h1>
            <p>Hi ${user.name},</p>
            <p>Your seat has been successfully reserved. Here are the details:</p>
            <ul>
                <li><strong>Seat:</strong> ${seat.seat_number} (${seat.location_area})</li>
                <li><strong>Date:</strong> ${new Date(reservation.reservation_date).toLocaleDateString()}</li>
            </ul>
            <p>Thank you for using our system.</p>
        `,
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Confirmation email sent. Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error('Error sending confirmation email:', error);
    }
};

const sendCancellationNotice = async (user, reservation, seat) => {
    const mailOptions = {
        from: '"Seat Reservation System" <noreply@seat-reservation.com>',
        to: user.email,
        subject: 'Your Seat Reservation has been Cancelled',
        html: `
            <h1>Booking Cancelled</h1>
            <p>Hi ${user.name},</p>
            <p>Your reservation for the following seat has been cancelled:</p>
            <ul>
                <li><strong>Seat:</strong> ${seat.seat_number} (${seat.location_area})</li>
                <li><strong>Date:</strong> ${new Date(reservation.reservation_date).toLocaleDateString()}</li>
            </ul>
        `,
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Cancellation email sent. Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error('Error sending cancellation email:', error);
    }
}


module.exports = { sendBookingConfirmation, sendCancellationNotice };