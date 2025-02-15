require('dotenv').config();
const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const db = require('../../db');

const router = express.Router();
const DB_TABLE_Auth = process.env.DB_TABLE_Auth ;

// // Passport strategy for authentication
// passport.use(
//     new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
//         db.get(`SELECT * FROM ${DB_TABLE_Auth} WHERE email = ?`, [email], async (err, user) => {
//             if (err) return done(err);
//             if (!user) return done(null, false, { message: 'User not found. Please register.' });

//             const isMatch = await bcrypt.compare(password, user.password);
//             if (!isMatch) return done(null, false, { message: 'Incorrect password. Try again.' });

//             return done(null, user);
//         });
//     })
// );

// passport.serializeUser((user, done) => {
//     done(null, user.id);
// });

// passport.deserializeUser((id, done) => {
//     db.get(`SELECT * FROM ${DB_TABLE_Auth} WHERE id = ?`, [id], (err, user) => {
//         if (err) {
//             console.error("Error fetching user from DB:", err);
//             return done(err, null);
//         }
//         if (!user) {
//             console.warn(`User with ID ${id} not found.`);
//             return done(null, false); // User not found
//         }
//         return done(null, user);
//     });
// });


router.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get(`SELECT * FROM ${DB_TABLE_Auth} WHERE email = ?`, [email], async (err, user) => {
        if (err) {
            console.error(err);
            return res.render('registration/login', { error: 'Internal server error.' });
        }
        if (!user) {
            return res.render('registration/login', { error: 'User not found. Please register.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('registration/login', { error: 'Incorrect password. Try again.' });
        }

        // No session, just redirect to /listener
        res.redirect('/listener');
    });
});

router.get('/login', (req, res) => {
    res.render('registration/login', { error: null });
});

// Logout route
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/login');
    });
});



module.exports = router;
