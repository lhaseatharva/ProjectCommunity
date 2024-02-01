const express = require('express');
const router = express.Router();
const { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } = require("firebase/auth");

// Define auth as a parameter
const initializeAuth = (auth) => {
    // Registration Route
    router.post('/register', (req, res) => {
        const { email, password } = req.body;

        createUserWithEmailAndPassword(auth, email, password)
            .then(userCredential => {
                // Handle successful registration
                const user = userCredential.user;
                res.json({ success: true });
            })
            .catch(error => {
                // Handle registration errors
                console.error(error.message);
                res.json({ success: false, message: error.message });
            });
    });

    // Login Route
    router.post('/login', (req, res) => {
        console.log('Received login request');
        const { email, password } = req.body;

        signInWithEmailAndPassword(auth, email, password)
            .then(userCredential => {
                // Handle successful login
                res.json({ success: true });
            })
            .catch(error => {
                // Handle login errors
                console.error(error.message);
                res.json({ success: false, message: error.message });
            });
    });
    router.post('/forgot-password', (req, res) => {
        const { email } = req.body;

        sendPasswordResetEmail(auth, email)
            .then(() => {
                // Password reset email sent successfully
                res.json({ success: true });
            })
            .catch(error => {
                // Handle errors during password reset
                console.error(error.message);
                res.json({ success: false, message: error.message });
            });
    });

    return router;
}

module.exports = initializeAuth;
