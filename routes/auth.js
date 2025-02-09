require('dotenv').config(); 
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db');



const DB_TABLE_Auth =process.env.DB_TABLE_Auth
const EMAIL_DOMAIN = process.env.EMAIL_DOMAIN;
const SECRET_KEY = process.env.SECRET_KEY || "securekey";

 
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


router.get('/register', (req, res) => {
    res.render('registration/register', { error: null, success: null });
});


router.post('/register', (req, res) => {
    const { email } = req.body;


    // Check if email is already registered
    db.get(`SELECT * FROM ${DB_TABLE_Auth} WHERE email = ?`, [email], async (err, existingAccount) => {
        if (err) {
            return res.render('registration/register', { error: "Internal server error. Please try again.", success: null });
        }

        if (existingAccount) {
            return res.render('registration/register', { error: "User already registered. Please login instead.", success: null });
        }

        if (!email.endsWith(`@${EMAIL_DOMAIN}`)) {
            return res.render('registration/register', { error: null, success: "A verification email has been sent. Please check your inbox." });
        }

        // Generate a verification token
        const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: '15m' });

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const verificationLink = `${baseUrl}/set-password/${token}`;

        // Send email with verification link
        transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Registration Verification',
            html: `<p>Click <a href="${verificationLink}">here</a> to complete your registration.</p>`
        }, (err, info) => {
            if (err) {
                console.error(err);
                return res.render('registration/register', { error: "Error sending verification email. Please try again.", success: null });
            }

            res.render('registration/register', { error: null, success: "A verification email has been sent. Please check your inbox." });
        });
    });
});





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
        return res.render('registration/set-password', { email: null, error: "Invalid or expired token. Please register again.", success: null });
    }

    if (password !== confirmPassword) {
        return res.render('registration/set-password', { email, error: "Passwords do not match!", success: null });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(`INSERT INTO ${DB_TABLE_Auth} (email, password) VALUES (?, ?)`, [email, hashedPassword], (err) => {
        if (err) {
            return res.render('registration/set-password', { email, error: "Error saving user. Try again.", success: null });
        }

        // Always pass both 'error' and 'success' variables to avoid reference errors
        res.render('registration/set-password', { email, error: null, success: "✅ You have successfully registered. Please sign in below." });
    });
});

router.get('/login', (req, res) => {
    res.render('registration/login', { error: null });
});


router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    db.get(`SELECT * FROM ${DB_TABLE_Auth} WHERE email = ?`, [email], async (err, existingAccount) => {
        if (err) {
            return res.render('registration/login', { error: "Internal server error. Please try again." });
        }
        if (!existingAccount) {
            return res.render('registration/login', { error: "User not found. Please check your email or register." });
        }

        const isMatch = await bcrypt.compare(password, existingAccount.password);
        if (!isMatch) {
            return res.render('registration/login', { error: "Incorrect password. Try again." });
        }

        res.send("✅ Login successful!");
    });
});

router.get('/forgot-password', (req, res) => {
    res.render('registration/forgot-password', { error: null, success: null });
});

router.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.render('registration/forgot-password', { error: "Please enter your email.", success: null });
    }

    db.get(`SELECT * FROM ${DB_TABLE_Auth} WHERE email = ?`, [email], (err, user) => {
        if (err || !user) {
            return res.render('registration/forgot-password', { error: "No account found with that email.", success: null });
        }

        // Generate a reset token
        const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: '15m' });

        const resetLink = `${req.protocol}://${req.get('host')}/reset-password/${token}`;

        transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
        }, (err) => {
            if (err) {
                return res.render('registration/forgot-password', { error: "Error sending reset email. Please try again.", success: null });
            }

            res.render('registration/forgot-password', { error: null, success: "An email has been sent with password reset instructions." });
        });
    });
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

        if (password !== confirmPassword) {
            return res.render('registration/reset-password', { token, error: "Passwords do not match!", success: null });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`UPDATE ${DB_TABLE_Auth} SET password = ? WHERE email = ?`, [hashedPassword, email], (err) => {
            res.render('registration/reset-password', { token: null, error: null, success: "✅ Password updated successfully! You may now log in." });
        });

    } catch (err) {
        res.render('registration/reset-password', { token: null, error: "Invalid or expired token.", success: null });
    }
});




module.exports = router;
