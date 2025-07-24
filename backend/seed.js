const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Hashed password for 'admin123'
const adminPassword = bcrypt.hashSync('admin123', 10); 
const adminEmail = 'admin@office.com';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const seedAdmin = async () => {
    try {
        // Check if the admin user already exists
        const checkRes = await pool.query("SELECT * FROM users WHERE email = $1", [adminEmail]);
        if (checkRes.rows.length > 0) {
            console.log('Admin user already exists. Seeding not required.');
            return;
        }

        // If not, insert the new admin user
        const insertQuery = `
            INSERT INTO users (name, email, password, role) 
            VALUES ($1, $2, $3, 'Admin')
            RETURNING *;
        `;
        const { rows } = await pool.query(insertQuery, ['Default Admin', adminEmail, adminPassword]);
        console.log('✅ Default admin user created successfully:');
        console.log({ id: rows[0].id, name: rows[0].name, email: rows[0].email, role: rows[0].role });

    } catch (err) {
        console.error('Error seeding admin user:', err);
    } finally {
        await pool.end(); // Close the connection
    }
};

seedAdmin();