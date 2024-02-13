const express = require('express');
const router = express.Router();
const { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } = require("firebase/auth");
const { getFirestore,collection, addDoc } = require('firebase/firestore');
const { initializeApp } = require("firebase/app");
const firebaseConfig = {
    apiKey: "AIzaSyAhzlH8qamQF5RTUu9QYeDRdaAUdN1Gv8E",
    authDomain: "project-community-27dac.firebaseapp.com",
    databaseURL: "https://project-community-27dac-default-rtdb.firebaseio.com",
    projectId: "project-community-27dac",
    storageBucket: "project-community-27dac.appspot.com",
    messagingSenderId: "441333565655",
    appId: "1:441333565655:web:3d96dd39037cfe35bdc892",
    measurementId: "G-DP6KE4FQDP"
};
const app = initializeApp(firebaseConfig);
const firestore = getFirestore();
const initializeAuth = (auth) => {
    // Registration Route
    router.post('/register', async (req, res) => {
        const { email, password, name, qualification } = req.body;

        try {
            // Create user with email and password
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save user data in Firestore
            await addDoc(collection(firestore, 'Users'), {
                uid: user.uid,
                email: email,
                name: name,
                qualification: qualification
            });

            res.json({ success: true });

        } catch (error) {
            console.error(error.message);
            res.json({ success: false, message: error.message });
        }
    });

    // Login Route
    router.post('/login', (req, res) => {
        console.log('Received login request');
        const { email, password } = req.body;

        signInWithEmailAndPassword(auth, email, password)
            .then(userCredential => {
                // Handle successful login
                res.json({ success: true });
                console.log('Logged in successfully');
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
