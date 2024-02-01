const express = require('express');
const router = express.Router();
const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = require("firebase/auth");
const { getStorage, sRef, uploadBytes } = require("firebase/storage");
const { push, getDatabase } = require("firebase/database");
const multer = require('multer');
const storageMulter = multer.memoryStorage();
const upload = multer({ storage: storageMulter });

// Define auth as a parameter
const initializeAuth = (auth) => {
    // Verify auth injection
    //console.log('Auth instance:', auth); // Check if a valid Firebase Auth object is passed
    const upload = multer({ storage: storageMulter }).single('file');
    const db = getDatabase();
    // Registration Route
    router.post('/register', (req, res) => {
        const { email, password, additionalData } = req.body;

        createUserWithEmailAndPassword(auth, email, password)
            .then(userCredential => {
                // Handle successful registration
                const user = userCredential.user;

                // Store additional user data in the Realtime Database
                const db = db();
                const userRef = sRef(db, `users/${user.uid}`);
                set(userRef, additionalData)
                    .then(() => {
                        res.json({ success: true });
                    })
                    .catch((error) => {
                        console.error('Error storing additional user data:', error);
                        res.json({ success: false, message: 'Error storing additional user data.' });
                    });
            })
            .catch((error) => {
                // Handle registration errors with more detail
                console.error('Registration error:', error.code, error.message);
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
                console.log('Logged in successfully');
                res.json({ success: true, redirect: 'welcome.html' });
            })
            .catch((error) => {
                // Handle login errors with more detail
                console.error('Login error:', error.code, error.message);
                res.json({ success: false, message: error.message });
            });
    });

    return router;
}

router.post('/submitcontribution', upload.array('files', 5), async (req, res) => {
    try {
        const { contributorName, contactNumber, education, projectType, enableDownload } = req.body;
        const files = req.files;

        // Store other contribution data in the Realtime Database
        const db = getDatabase();
        const contributionsRef = sRef(db, 'Contributions');
        const newContributionRef = push(contributionsRef);

        const contributionData = {
            contributorName,
            contactNumber,
            education,
            projectType,
            enableDownload: enableDownload === 'on', // Convert string to boolean
        };

        // Save contribution data
        await set(newContributionRef, contributionData);

        // Upload files to Firebase Storage
        const storage = getStorage();
        const promises = files.map(async (file) => {
            const fileRef = sRef(storage, `Contributions/${newContributionRef.key}/${file.originalname}`);
            await uploadBytes(fileRef, file.buffer);
        });

        await Promise.all(promises);

        // Only send success response after both database and storage operations are completed
        res.json({ success: true, message: 'Contribution submitted successfully.' });
    } catch (error) {
        console.error('Error submitting contribution:', error);
        res.status(500).json({ success: false, message: 'Error submitting contribution.' });
    }
});


module.exports = initializeAuth;
