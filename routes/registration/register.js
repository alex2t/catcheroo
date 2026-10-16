require('dotenv').config();
const express = require('express');
const router = express.Router();
const db = require('../../db');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { isValidEmail } = require('../../utils/auth');
const SECRET_KEY = process.env.SECRET_KEY;
const EMAIL_DOMAIN = process.env.EMAIL_DOMAIN;

const DB_TABLE_Auth = process.env.DB_TABLE_Auth;


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

router.get('/register', (req, res) => {
    res.render('registration/register', { error: null, success: null });
});


router.post('/register', (req, res) => {
    const { email } = req.body;

    // Validate email format
    if (!isValidEmail(email)) {
        return res.render('registration/register', { error: "Invalid email format. Please enter a valid email.", success: null });
    }

    // Check if the email belongs to the allowed domain
    if (!email.endsWith(`@${EMAIL_DOMAIN}`)) {
        return res.render('registration/register', { error: null, success: "A verification email has been sent. Please check your inbox." });
    }

    // Check if email is already registered
    db.get(`SELECT * FROM ${DB_TABLE_Auth} WHERE email = ?`, [email], async (err, existingAccount) => {
        if (err) {
            return res.render('registration/register', { error: "Internal server error. Please try again.", success: null });
        }

        if (existingAccount) {
            return res.render('registration/register', { error: "User already registered. Please login instead.", success: null });
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
module.exports = router;
