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

// Map Firebase popup errors to actionable user-facing messages
// (esp. helpful for deployed environments: authorized domains, popup blockers)
export const describeGoogleSignInError = (err) => {
  switch (err?.code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return null; // user dismissed — not an error worth showing
    case 'auth/popup-blocked':
      return 'Popup was blocked by the browser. Allow popups for this site and try again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Google sign-in. Add it in Firebase Console → Authentication → Settings → Authorized domains.';
    case 'auth/network-request-failed':
      return 'Network error contacting Google. Check your connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled for this Firebase project. Enable it in Firebase Console → Authentication → Sign-in method.';
    default:
      return null;
  }
};

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
