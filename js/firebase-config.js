// Firebase initialization (ES module)
// Replace the config object with your Firebase project's values.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

// Firebase Configuration
// Get these values from your Firebase Console:
// 1. Go to https://console.firebase.google.com/
// 2. Select your project or create a new one
// 3. Click Settings (gear icon) > Project settings
// 4. Copy values from the firebaseConfig object shown there
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",                    // Copy from Firebase Console
  authDomain: "YOUR_AUTH_DOMAIN",            // e.g., "myproject.firebaseapp.com"
  projectId: "YOUR_PROJECT_ID",              // e.g., "my-project-12345"
  storageBucket: "YOUR_BUCKET",              // e.g., "my-project-12345.appspot.com"
  messagingSenderId: "YOUR_SENDER_ID",       // Numeric ID
  appId: "YOUR_APP_ID"                       // Format: 1:123456789:web:abc123...
};

// IMPORTANT: Replace the placeholder values above with your actual Firebase credentials
// Do NOT commit credentials with placeholder values to production

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
