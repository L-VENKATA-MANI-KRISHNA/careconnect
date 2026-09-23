// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyChtoi2fWj0q9nNd8CY1bhN1zWsWwkRmcI",
  authDomain: "careconnect-6a811.firebaseapp.com",
  projectId: "careconnect-6a811",
  storageBucket: "careconnect-6a811.firebasestorage.app",
  messagingSenderId: "625509910269",
  appId: "1:625509910269:web:a6e573e445c496345c6094",
  measurementId: "G-5K0LSTGXFS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

// Initialize Analytics conditionally for browser environment support
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.warn("Firebase Analytics could not be initialized:", err);
  });
}

export { app, analytics, auth, googleProvider };
export default app;
