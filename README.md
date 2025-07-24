# Seat Reservation System for Interns

A full-stack web application for booking office desks, designed with a modern, responsive UI. The system allows interns to book available seats, and provides administrators with a dashboard to manage users, seats, and view usage statistics.

---

## ✨ Features

### Interns
-   **Secure Authentication:** Register and log in with JWT-based authentication.
-   **View Password:** Toggle password visibility on login/register forms.
-   **Seat Booking:** View available seats on a given date and book a desired seat.
-   **Confirmation Modal:** A professional confirmation step before finalizing a booking.
-   **My Reservations:** View a list of all current and past reservations.
-   **Cancel Bookings:** Cancel any future reservation.
-   **Email Notifications:** Receive email confirmations for bookings and cancellations (powered by Nodemailer).

### Admins
-   **Admin Dashboard:** A central panel with key statistics.
-   **Stats at a Glance:** View total seats, seats booked today, and current office utilization rate.
-   **Reservation Management:** View a filterable list of all reservations made by all interns.
-   **Seat Management:** Add or delete office seats from the system.
-   **Usage Reports:** A visual bar chart showing booking trends over the last 7 days.

---

## 🛠️ Tech Stack

-   **Frontend:** HTML5, CSS3, Vanilla JavaScript, Bootstrap 5, Chart.js
-   **Backend:** Node.js, Express.js
-   **Database:** PostgreSQL
-   **Authentication:** JSON Web Tokens (JWT), bcrypt
-   **Email:** Nodemailer

---

## 🚀 Setup and Installation

To run this project locally, follow these steps:

### Prerequisites
-   [Node.js](https://nodejs.org/) installed
-   [PostgreSQL](https://www.postgresql.org/download/) installed and running

### 1. Clone the repository
```bash
git clone https://github.com/nethru2002/seat-reservation-system.git
cd seat-reservation-system
```

### 2. Backend Setup
```bash
# Navigate to the backend folder
cd backend

# Install dependencies
npm install

# Create a .env file (copy from .env.example)
cp .env.example .env
```
Now, open the newly created `.env` file and fill in your PostgreSQL credentials and an [Ethereal](https://ethereal.email/) account for testing emails.

### 3. Database Setup
1.  Open your PostgreSQL client (e.g., `psql` or pgAdmin).
2.  Create a new database:
    ```sql
    CREATE DATABASE seat_reservation_db;
    ```
3.  Connect to the new database and run the SQL script located at `/backend/database.sql` to create all the necessary tables and types.
    *(Note: You will need to create this `database.sql` file by copying the SQL from our previous steps)*

### 4. Running the Application
1.  **Start the Backend Server:**
    ```bash
    # From the /backend directory
    node server.js
    ```
    The server should now be running on `http://localhost:3000`.

2.  **Run the Frontend:**
    -   Navigate to the `/frontend` directory in your file explorer.
    -   Open the `index.html` file in your web browser.

---