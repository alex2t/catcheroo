// js/auth.js

/**
 * Generate a unique 6-character alphanumeric ID.
 * @returns {string} A random 6-character ID.
 */
const generateUID = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

/**
 * Validate password security.
 * Password must be:
 * - At least 8 characters long
 * - Contain at least one uppercase letter
 * - Contain at least one lowercase letter
 * - Contain at least one number
 * @param {string} password - The password to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
const isValidPassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return passwordRegex.test(password);
};

/**
 * Validate email format.
 * @param {string} email - The email to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Export functions for use in other files
module.exports = { generateUID, isValidPassword, isValidEmail };
