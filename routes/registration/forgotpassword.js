const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const db = require('../../db');


const SECRET_KEY = process.env.SECRET_KEY;
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

router.get('/forgot-password', (req, res) => {
    res.render('registration/forgot-password', { error: null, success: null });
});

router.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err || !user) {
            return res.render('registration/forgot-password', { error: "No account found with that email.", success: null });
        }

        const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: '15m' });
        const resetLink = `${req.protocol}://${req.get('host')}/reset-password/${token}`;

        transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
        }, () => {
            res.render('registration/forgot-password', { success: "Email sent.", error: null });
        });
    });
});
module.exports = router;