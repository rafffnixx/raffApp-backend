require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg'); // PostgreSQL library
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');


const app = express();
const port = process.env.PORT || 3000;



// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('frontend')); // Serve static files

// PostgreSQL Database Connection
const pool = new Pool({
    user: process.env.PG_USER || 'postgres',
    host: process.env.PG_HOST || 'localhost',
    database: process.env.PG_DATABASE || 'newapp',
    password: process.env.PG_PASSWORD || '',
    port: process.env.PG_PORT || 5432,
});

// Verify Database Connection
pool.connect((err) => {
    if (err) {
        console.error('Error connecting to PostgreSQL:', err.message);
    } else {
        console.log('Connected to PostgreSQL database');
    }
});

// Create Users Table
const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
    );
`;
pool.query(createUsersTable, (err) => {
    if (err) {
        console.error('Error creating users table:', err.message);
    } else {
        console.log('Users table is ready');
    }
});

// Create Services Table
const createServicesTable = `
    CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL,
        imageUrl TEXT, -- Path or URL of the image
        description TEXT
    );
`;
pool.query(createServicesTable, (err) => {
    if (err) {
        console.error('Error creating services table:', err.message);
    } else {
        console.log('Services table is ready');
    }
});

//update unhashed password
const updatePassword = async () => {
    const plainPassword = '4325';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const query = 'UPDATE admin SET password = $1 WHERE username = $2';
    const values = [hashedPassword, 'RAFFADMIN'];

    await pool.query(query, values);
    console.log('Password updated successfully!');
};

updatePassword();

// Create Requests Table
const createRequestsTable = `
    CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        product_name TEXT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'Pending'
    );
`;
pool.query(createRequestsTable, (err) => {
    if (err) {
        console.error('Error creating requests table:', err.message);
    } else {
        console.log('Requests table is ready');
    }
});

// Register Route
app.post('/api/auth/register', async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ error: 'Missing username, password, or role' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `
            INSERT INTO users (username, password, role) 
            VALUES ($1, $2, $3) 
            RETURNING id, username, role;
        `;
        const values = [username, hashedPassword, role];
        const result = await pool.query(query, values);

        res.status(201).json({ message: 'User registered successfully!', user: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            res.status(409).json({ error: 'Username already exists' });
        } else {
            console.error('Error registering user:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Missing username or password' });
    }

    try {
        const query = 'SELECT * FROM users WHERE username = $1';
        const result = await pool.query(query, [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = result.rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Include the username in the response
        res.json({ message: 'Login successful', token, username: user.username });
    } catch (error) {
        console.error('Error logging in:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Add Service Route
app.post('/api/services', async (req, res) => {
    const { category, name, price, imageUrl, description } = req.body;

    if (!category || !name) {
        return res.status(400).json({ error: 'Category and name are required' });
    }

    try {
        const query = `
            INSERT INTO services (category, name, price, imageUrl, description) 
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const values = [category, name, price, imageUrl, description];
        const result = await pool.query(query, values);

        res.status(201).json({ message: 'Service added successfully!', service: result.rows[0] });
    } catch (error) {
        console.error('Error adding service:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get All Services Route
app.get('/api/services', async (req, res) => {
    try {
        const query = 'SELECT * FROM services;';
        const result = await pool.query(query);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching services:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add Request Route
app.post('/api/requests', async (req, res) => {
    const { username, product_name, quantity } = req.body;

    // Debugging: Log the incoming payload
    console.log("Request received:", req.body);

    if (!username || !product_name || !quantity) {
        console.error("Missing fields in the request:", { username, product_name, quantity });
        return res.status(400).json({ error: 'Missing username, product name, or quantity' });
    }

    try {
        const query = `
            INSERT INTO requests (username, product_name, quantity) 
            VALUES ($1, $2, $3) 
            RETURNING *;
        `;
        const values = [username, product_name, quantity];
        const result = await pool.query(query, values);

        // Debugging: Confirm successful storage
        console.log("Request stored in database:", result.rows[0]);

        res.status(201).json({ message: 'Request submitted successfully!', request: result.rows[0] });
    } catch (error) {
        console.error('Error submitting request:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get All Requests (Admin)
app.get('/api/requests', async (req, res) => {
    try {
        const query = 'SELECT * FROM requests;';
        const result = await pool.query(query);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching all requests:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});
//request dispatch for updating request dispatch
app.patch('/api/requests/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }

    try {
        const query = 'UPDATE requests SET status = $1 WHERE id = $2 RETURNING *';
        const values = [status, id];
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        res.status(200).json({ message: 'Status updated successfully!', request: result.rows[0] });
    } catch (error) {
        console.error('Error updating request status:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//get user request page
app.get('/api/requests/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const query = 'SELECT * FROM requests WHERE username = $1';
        const result = await pool.query(query, [username]);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching user requests:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Define the rate limiter
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per window
    message: 'Too many login attempts. Please try again later.',
});

// Create Admin Table
const createAdminTable = `
    CREATE TABLE IF NOT EXISTS admin (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin'
    );
`;

pool.query(createAdminTable, (err) => {
    if (err) {
        console.error('Error creating admin table:', err.message);
    } else {
        console.log('Admin table is ready');
    }
});

// Add Admin Credentials
const addAdmin = async () => {
    const username = process.env.ADMIN_USERNAME || 'ADMIN';
    const plainPassword = process.env.ADMIN_PASSWORD || 'default_password';

    try {
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const query = `
            INSERT INTO admin (username, password, role)
            VALUES ($1, $2, 'admin')
            ON CONFLICT (username) DO NOTHING;
        `;

        const values = [username, hashedPassword];
        await pool.query(query, values);

        console.log('Admin credentials added successfully!');
    } catch (error) {
        console.error('Error adding admin credentials:', error.message);
    }
};

addAdmin();

///add admin route
app.post('/api/admin/add', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Missing username or password.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO admin (username, password, role)
            VALUES ($1, $2, 'admin')
            ON CONFLICT (username) DO NOTHING;
        `;
        const values = [username, hashedPassword];

        await pool.query(query, values);

        res.json({ message: `Admin ${username} added successfully!` });
    } catch (error) {
        console.error('Error adding admin:', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
});



// Admin login route
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const query = 'SELECT * FROM admin WHERE username = $1';
        const result = await pool.query(query, [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const admin = result.rows[0];

        // Validate password
        const isValidPassword = await bcrypt.compare(password, admin.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        // Generate JWT token for admin
        const token = jwt.sign(
            { id: admin.id, username: admin.username, role: admin.role },
            process.env.JWT_SECRET, // Use a secret key from environment variables
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        res.json({ token });
    } catch (error) {
        console.error('Error during admin login:', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
});


// Admin Profile Route
app.get('/api/admin/profile', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract the token from the Authorization header

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided.' });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Query the database to get admin details
        const query = 'SELECT id, username, role FROM admin WHERE id = $1';
        const result = await pool.query(query, [decoded.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Admin not found.' });
        }

        res.json(result.rows[0]); // Return the admin details
    } catch (error) {
        console.error('Error verifying token:', error.message);
        res.status(401).json({ error: 'Unauthorized: Invalid token.' });
    }
});

app.get('/api/admin/all', async (req, res) => {
    try {
        const query = 'SELECT id, username, role FROM admin;';
        const result = await pool.query(query);

        res.json(result.rows); // Return all admin details
    } catch (error) {
        console.error('Error fetching admins:', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

//verify admin tocken
const verifyAdminToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Ensure the user is an admin
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Not an admin.' });
        }

        req.admin = decoded; // Attach admin info to the request
        next();
    } catch (error) {
        console.error('Error verifying token:', error.message);
        res.status(401).json({ error: 'Unauthorized: Invalid token.' });
    }
};



// Start the Server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
