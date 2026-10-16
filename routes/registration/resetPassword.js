require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const db = require('../../db');
const { isValidPassword } = require('../../utils/auth');

const DB_TABLE_Auth = process.env.DB_TABLE_Auth || 'users';
const SECRET_KEY = process.env.SECRET_KEY;
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});



router.get('/reset-password/:token', (req, res) => {
    const { token } = req.params;

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        res.render('registration/reset-password', { token, error: null, success: null });
    } catch (err) {
        res.render('registration/reset-password', { token: null, error: "Invalid or expired token.", success: null });
    }
});


router.post('/reset-password', async (req, res) => {
    const { token, password, confirmPassword } = req.body;

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const email = decoded.email;

        // Validate password strength
        if (!isValidPassword(password)) {
            return res.render('registration/reset-password', { 
                token, 
                error: "Password must be at least 8 characters, include an uppercase letter, a lowercase letter, and a number.", 
                success: null 
            });
        }

        if (password !== confirmPassword) {
            return res.render('registration/reset-password', { token, error: "Passwords do not match!", success: null });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`UPDATE ${DB_TABLE_Auth} SET password = ? WHERE email = ?`, [hashedPassword, email], (err) => {
            res.render('registration/reset-password', { token: null, error: null, success: "✅ Password updated successfully! You may now log in." });
        });

    } catch (err) {
        console.log(err)
        res.render('registration/reset-password', { token: null, error: "Invalid or expired token.", success: null });
    }
});
module.exports = router;
