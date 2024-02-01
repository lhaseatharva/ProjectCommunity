const express = require('express');
const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword, signOut } = require("firebase/auth");
const { getDatabase, ref, push, set } = require("firebase/database");
const { getStorage, ref: storageRef, uploadBytes } = require("firebase/storage");
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');

const corsOptions = {
    origin: 'http://127.0.0.1:5500', // Update with your frontend URL
    optionsSuccessStatus: 200,
};

// **Firebase Configuration**
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

// **Initialize Firebase App**
const appFirebase = initializeApp(firebaseConfig);
const auth = getAuth(appFirebase);
const db = getDatabase(appFirebase);
const storage = getStorage(appFirebase);

// **Create Express App**
const appExpress = express();

// **Middleware**
appExpress.use(bodyParser.json());
appExpress.use(bodyParser.urlencoded({ extended: true }));
appExpress.use(cors(corsOptions));
appExpress.use(express.static('public'));

// Multer setup for handling file uploads
const storageMulter = multer.memoryStorage();
const uploadMulter = multer({ storage: storageMulter });

// **Routes**
const authRoutes = require('./routes/auth')(auth, storageMulter);
appExpress.use('/auth', authRoutes);

// **Login Page Route**
appExpress.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

// **Welcome Page Route**
appExpress.get('/welcome', (req, res) => {
    const user = auth.currentUser;
    if (user) {
        res.sendFile(__dirname + '/public/welcome.html');
    } else {
        res.redirect('/login');
    }
});

// **Logout Route**
appExpress.post('/logout', (req, res) => {
    signOut(auth)
        .then(() => {
            res.redirect('/login');
        })
        .catch(error => {
            console.error(error.message);
            res.redirect('/welcome');
        });
});

// **Submit Contribution Route**
appExpress.post('/submitcontribution', uploadMulter.array('files'), async (req, res) => {
    try {
        const contributorName = req.body.contributorName;
        const contactNumber = req.body.contactNumber;
        const education = req.body.education;
        const projectType = req.body.projectType;
        const enableDownload = req.body.enableDownload === 'on';

        // Store contribution metadata in Realtime Database
        const contributionsRef = ref(db, 'Contributions');
        const newContributionRef = push(contributionsRef);

        const contributionData = {
            contributorName,
            contactNumber,
            education,
            projectType,
            enableDownload,
            timestamp: Date.now(),
            // Add any other metadata fields you need
        };

        await set(newContributionRef, contributionData);

        // Upload file(s) to Firebase Storage
        const files = req.files;
        const promises = files.map(async (file) => {
            const fileRef = storageRef(storage, `contributions/${newContributionRef.key}/${file.originalname}`);
            await uploadBytes(fileRef, file.buffer);
        });

        await Promise.all(promises);

        res.status(200).send('Contribution submitted successfully.');
    } catch (error) {
        console.error('Error during contribution submission:', error);
        res.status(500).send('Internal Server Error.');
    }
});

// **Start the Server**
const PORT = process.env.PORT || 3000;
appExpress.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
