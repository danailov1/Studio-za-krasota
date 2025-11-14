import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyB4_6oQvWXGEbKr3o5fcRLsp4-xC4nRPag",
  authDomain: "studio-babb1.firebaseapp.com",
  projectId: "studio-babb1",
  storageBucket: "studio-babb1.firebasestorage.app",
  messagingSenderId: "357574611996",
  appId: "1:357574611996:web:59d4f0afb01fc7633a3bd9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };