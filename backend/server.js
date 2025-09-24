// --- Core Dependencies ---
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); 

// --- Middleware ---
const authMiddleware = require('./middleware/authMiddleware');

// --- Initial Server Setup ---
dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

// --- Global Middleware ---
app.use(cors());
app.use(express.json()); // Allows the server to parse JSON request bodies

// --- MySQL Connection Pool ---
// Using a pool is more efficient than creating a new connection for every query.
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- Test Database Connection on Startup ---
pool.getConnection((err, connection) => {
    if (err) {
        console.error('!!! DATABASE CONNECTION ERROR !!!:', err);
        return;
    }
    console.log('Successfully connected to MySQL database!');
    connection.release(); // Release the connection back to the pool
});


// =================================================================
// --- AUTHENTICATION ROUTES ---
// =================================================================

/**
 * @route   POST /api/register
 * @desc    Registers a new user.
 * @access  Public
 * @body    { email, password }
 */
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;

    // Basic validation for required fields.
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Check if a user with the given email already exists to prevent duplicates.
        const [users] = await pool.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

        // Hash the password for security before storing it in the database.
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database with the 'onboarded' flag set to false (0).
        await pool.promise().query(
            'INSERT INTO users (email, password, onboarded) VALUES (?, ?, ?)', 
            [email, hashedPassword, 0]
        );

        // Retrieve the newly created user to send back in the response.
        const [newUsers] = await pool.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        const newUser = newUsers[0];
        
        delete newUser.password; // Never send the password hash back to the client.

        res.status(201).json({ message: 'User registered successfully', user: newUser });

    } catch (error) {
        console.error('!!! REGISTRATION ERROR !!!:', error); 
        res.status(500).json({ message: 'An error occurred during registration' });
    }
});

/**
 * @route   POST /api/login
 * @desc    Logs in a user and returns a JWT.
 * @access  Public
 * @body    { email, password }
 */
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Find the user by their email address.
        const [users] = await pool.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            // Use a generic error message for security to not reveal if an email is registered.
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        const user = users[0];
        
        // Compare the provided password with the hashed password in the database.
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // If credentials are correct, create a JWT payload and sign the token.
        const payload = { id: user.id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        delete user.password;
        
        // Send the user object and the token back to the client.
        res.status(200).json({ user: user, token: token });

    } catch (error) {
        console.error('!!! LOGIN ERROR !!!:', error);
        res.status(500).json({ message: 'An error occurred during login' });
    }
});


// =================================================================
// --- USER PROFILE & MANAGEMENT ROUTES ---
// =================================================================

/**
 * @route   PUT /api/profile/password
 * @desc    Changes a logged-in user's password.
 * @access  Private (requires authMiddleware)
 * @body    { oldPassword, newPassword }
 */
app.put('/api/profile/password', authMiddleware, async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Old and new passwords are required' });
    }

    try {
        // The user's ID is attached to req.user by the authMiddleware.
        const [users] = await pool.promise().query('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = users[0];

        // Verify that the provided old password is correct.
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect old password' });
        }

        // Hash the new password and update it in the database.
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await pool.promise().query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, user.id]);
        
        res.status(200).json({ message: 'Password updated successfully' });

    } catch (error) {
        console.error('!!! PASSWORD CHANGE ERROR !!!:', error);
        res.status(500).json({ message: 'An error occurred while changing the password' });
    }
});

/**
 * @route   POST /api/forgot-password
 * @desc    Initiates the password reset process.
 * @access  Public
 * @body    { email }
 */
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const [users] = await pool.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        
        // If a user exists, proceed with token generation.
        if (users.length > 0) {
            const user = users[0];

            // Create a secure, random token.
            const resetToken = crypto.randomBytes(32).toString('hex');
            // Hash the token before storing it for added security.
            const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

            // Set the token's expiration to 1 hour from now.
            const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour

            await pool.promise().query(
                'UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?',
                [hashedResetToken, tokenExpiry, user.id]
            );

            // In a real application, you would send an email here.
            // const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
            // await sendPasswordResetEmail(user.email, resetUrl);
        }
        
        // Always send a generic success message to prevent email enumeration attacks.
        res.status(200).json({ message: 'If a user with that email exists, a password reset link has been sent.' });

    } catch (error) {
        console.error('!!! FORGOT PASSWORD ERROR !!!:', error);
        res.status(500).json({ message: 'An error occurred' });
    }
});

/**
 * @route   POST /api/reset-password
 * @desc    Resets the user's password using a valid token.
 * @access  Public
 * @body    { token, newPassword }
 */
app.post('/api/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
    }

    try {
        // Hash the incoming token to compare it with the hashed version in the database.
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find a user with a matching token that has not expired.
        const [users] = await pool.promise().query(
            'SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiry > NOW()',
            [hashedToken]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired password reset token.' });
        }

        const user = users[0];
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update the password and clear the reset token fields to prevent reuse.
        await pool.promise().query(
            'UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?',
            [hashedNewPassword, user.id]
        );

        res.status(200).json({ message: 'Password has been reset successfully.' });

    } catch (error) {
        console.error('!!! RESET PASSWORD ERROR !!!:', error);
        res.status(500).json({ message: 'An error occurred while resetting the password.' });
    }
});

/**
 * @route   PUT /api/onboarding
 * @desc    Completes the onboarding process for a new user.
 * @access  Private (requires authMiddleware)
 * @body    { name, username }
 */
app.put('/api/onboarding', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { name, username } = req.body;

    if (!name || !username) {
        return res.status(400).json({ message: 'Name and username are required' });
    }

    try {
        // Check if the chosen username is already taken by another user.
        const [existingUser] = await pool.promise().query(
            'SELECT * FROM users WHERE username = ? AND id != ?',
            [username, userId]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Username is already taken. Please choose another.' });
        }

        // Update the user's record with the new details and set onboarded to true (1).
        await pool.promise().query(
            'UPDATE users SET name = ?, username = ?, onboarded = 1 WHERE id = ?',
            [name, username, userId]
        );

        res.status(200).json({ message: 'Onboarding completed successfully!' });

    } catch (error) {
        console.error('!!! ONBOARDING ERROR !!!:', error);
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ message: 'Username is already taken. Please choose another.' });
        }
        res.status(500).json({ message: 'An error occurred during the onboarding process.' });
    }
});


// =================================================================
// --- SERVER INITIALIZATION ---
// =================================================================
app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});