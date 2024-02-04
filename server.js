const express = require('express');
const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } = require("firebase/auth");
const { getFirestore, collection, addDoc, getDocs, serverTimestamp } = require("firebase/firestore");
const { getStorage, ref: storageRef, uploadBytes } = require("firebase/storage");
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');

const corsOptions = {
    origin: 'http://127.0.0.1:5500', // Update with your frontend URL
    optionsSuccessStatus: 200,
};

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAhzlH8qamQF5RTUu9QYeDRdaAUdN1Gv8E",
    authDomain: "project-community-27dac.firebaseapp.com",
    projectId: "project-community-27dac",
    storageBucket: "project-community-27dac.appspot.com",
    messagingSenderId: "441333565655",
    appId: "1:441333565655:web:3d96dd39037cfe35bdc892",
    measurementId: "G-DP6KE4FQDP"
};

// Initialize Firebase App
const appFirebase = initializeApp(firebaseConfig);
const auth = getAuth(appFirebase);
const db = getFirestore(appFirebase);
const storage = getStorage(appFirebase);

// Create Express App
const appExpress = express();

// Middleware
appExpress.use(cors(corsOptions));
appExpress.use(bodyParser.json());
appExpress.use(bodyParser.urlencoded({ extended: true }));
appExpress.use(express.static('public'));

// Multer setup for handling file uploads
const storageMulter = multer.memoryStorage();
const uploadMulter = multer({ storage: storageMulter });

// Routes
const authRoutes = require('./routes/auth')(auth); // Pass auth to the routes
appExpress.use('/auth', cors(corsOptions), authRoutes);

// Routes

appExpress.post('/forgot-password', async (req, res) => {
    try {
        const email = req.body.email;

        // Send password reset email using Firebase's sendPasswordResetEmail method
        await sendPasswordResetEmail(auth, email);

        res.json({ success: true, message: 'Password reset instructions sent to your email.' });
    } catch (error) {
        console.error('Error during forgot password:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error.' });
    }
});

appExpress.post('/submitcontribution', uploadMulter.array('files'), async (req, res) => {
    try {
        const contributorName = req.body.contributorName;
        const contactNumber = req.body.contactNumber;
        const education = req.body.education;
        const projectType = req.body.projectType;
        const expectedPrice = req.body.expectedPrice;
        const enableDownload = req.body.enableDownload === 'on';

        // Store contribution metadata in Firestore
        const contributionsRef = collection(db, 'Contributions');
        const newContributionRef = await addDoc(contributionsRef, {
            contributorName,
            contactNumber,
            education,
            projectType,
            enableDownload,
            expectedPrice,
            timestamp: serverTimestamp(),
        });

        // Upload file(s) to Firebase Storage
        const files = req.files;
        const promises = files.map(async (file) => {
            const fileRef = storageRef(storage, `contributions/${newContributionRef.id}/${file.originalname}`);
            await uploadBytes(fileRef, file.buffer);
        });

        await Promise.all(promises);

        res.status(200).send('Contribution submitted successfully.');
    } catch (error) {
        console.error('Error during contribution submission:', error);
        res.status(500).send('Internal Server Error.');
    }
});

appExpress.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

// Welcome page route
appExpress.get('/welcome', (req, res) => {
    // Check if the user is logged in (customize this check based on your authentication mechanism)
    const user = auth.currentUser;

    if (user) {
        res.sendFile(__dirname + '/public/welcome.html');
    } else {
        res.redirect('/login'); // Redirect to login if the user is not logged in
    }
});

// Logout route
appExpress.post('/logout', (req, res) => {
    signOut(auth)
        .then(() => {
            res.redirect('/login');
        })
        .catch(error => {
            console.error(error.message);
            res.redirect('/welcome'); // Redirect back to welcome page on error
        });
});

appExpress.get('/fetchprojects', async (req, res) => {
    try {
        const contributionsRef = collection(db, 'Contributions');
        const snapshot = await getDocs(contributionsRef);

        const projects = [];
        snapshot.forEach(doc => {
            const projectData = doc.data();
            projects.push({
                id: doc.id,
                contributorName: projectData.contributorName,
                contactNumber: projectData.contactNumber,
                education: projectData.education,
                projectType: projectData.projectType,
                enableDownload: projectData.enableDownload,
                expectedPrice: projectData.expectedPrice,
                timestamp: projectData.timestamp,
                // Add other fields as needed
            });
        });

        res.json({ success: true, projects });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error.' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
appExpress.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
