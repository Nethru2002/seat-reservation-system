--
-- PostgreSQL database schema for the Seat Reservation System
--

-- Drop existing tables and types if they exist, to ensure a clean setup.
-- This is useful for re-running the script.
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS seats;
DROP TABLE IF EXISTS users;
DROP TYPE IF EXISTS reservation_status;
DROP TYPE IF EXISTS user_role;


-- Section 1: Custom Data Types (ENUMs)
-- Using ENUMs ensures data integrity for roles and statuses.

CREATE TYPE user_role AS ENUM ('Intern', 'Admin');
CREATE TYPE reservation_status AS ENUM ('Active', 'Cancelled');


-- Section 2: Table Definitions

--
-- Table structure for table "users"
--
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'Intern'
);

COMMENT ON TABLE users IS 'Stores user information for both interns and admins.';


--
-- Table structure for table "seats"
--
CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    seat_number VARCHAR(20) UNIQUE NOT NULL,
    location_area VARCHAR(100)
);

COMMENT ON TABLE seats IS 'Stores information about each physical seat/desk in the office.';


--
-- Table structure for table "reservations"
--
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    intern_id INT NOT NULL,
    seat_id INT NOT NULL,
    reservation_date DATE NOT NULL,
    status reservation_status NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign Key Constraints to link tables
    CONSTRAINT fk_intern
        FOREIGN KEY(intern_id)
        REFERENCES users(id)
        ON DELETE CASCADE, -- If a user is deleted, their reservations are also deleted.
        
    CONSTRAINT fk_seat
        FOREIGN KEY(seat_id)
        REFERENCES seats(id)
        ON DELETE CASCADE, -- If a seat is deleted, its reservations are also deleted.

    -- Business Logic Constraints
    -- An intern can only book one active seat per day.
    UNIQUE (intern_id, reservation_date) WHERE (status = 'Active'),
    
    -- A seat can only be booked by one intern per day for active reservations.
    UNIQUE (seat_id, reservation_date) WHERE (status = 'Active')
);

COMMENT ON TABLE reservations IS 'Stores reservation records, linking users to seats on specific dates.';


-- Section 3: Optional Sample Data
-- This data helps in testing the application immediately after setup.

INSERT INTO seats (seat_number, location_area) VALUES
('A1', 'Alpha Wing'),
('A2', 'Alpha Wing'),
('A3', 'Alpha Wing'),
('B1', 'Bravo Wing'),
('B2', 'Bravo Wing'),
('C1', 'Collaboration Zone'),
('C2', 'Collaboration Zone');

-- Note: A default admin user is not added here.
-- The recommended way to create an admin is to:
-- 1. Register a user through the application's UI.
-- 2. Manually update their role in the database using the following command:
--    UPDATE users SET role = 'Admin' WHERE email = 'your-admin-email@office.com';

-- End of script