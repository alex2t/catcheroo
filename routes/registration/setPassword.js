require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../../db');
const { isValidPassword } = require('../../utils/auth');
const {generateUID } = require('../../utils/auth');

const SECRET_KEY = process.env.SECRET_KEY || "securekey";
const DB_TABLE_Auth = process.env.DB_TABLE_Auth ;



router.get('/set-password/:token', (req, res) => {
    const { token } = req.params;

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const email = decoded.email;

        // Ensure 'success' is always passed to prevent undefined errors
        res.render('registration/set-password', { email, error: null, success: null });
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.render('registration/set-password', { email: null, error: " Link expired! Please register again.", success: null });
        } else {
            return res.render('registration/set-password', { email: null, error: "Invalid token. Please try again.", success: null });
        }
    }
});



router.post('/set-password', async (req, res) => {
    const { email, password, confirmPassword } = req.body;

    if (!email) {
        return res.render('registration/set-password', { email: null, error: "Invalid or expired token. Please register again." });
    }

    if (!isValidPassword(password)) {
        return res.render('registration/set-password', { email, error: "Password must be at least 8 characters, include an uppercase letter, a lowercase letter, and a number.", success: null });
    }

    if (password !== confirmPassword) {
        return res.render('registration/set-password', { email, error: "Passwords do not match!", success: null });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const registrationDate = new Date().toISOString();
    const passwordResetDate = new Date();
    passwordResetDate.setDate(passwordResetDate.getDate() + 90);

    const uid = generateUID();

    db.run(
        `INSERT INTO ${DB_TABLE_Auth} (uid, email, password, registration_date, password_reset_date) VALUES (?, ?, ?, ?, ?)`,
        [uid, email, hashedPassword, registrationDate, passwordResetDate.toISOString()],
        (err) => {
            if (err) {
                console.log(err)
                return res.render('registration/set-password', { email, error: "Error saving user. Try again.", success: null });
            }
            res.render('registration/set-password', { email, error: null, success: "✅ Registration successful! You can now log in." });
        }
    );
});


module.exports = router;
