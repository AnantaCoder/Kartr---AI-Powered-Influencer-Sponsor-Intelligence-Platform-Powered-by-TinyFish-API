
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

// Bun inlines process.env.* at bundle time for variables matching bunfig.toml env pattern
const firebaseConfig = {
  apiKey: process.env.BUN_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.BUN_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.BUN_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.BUN_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.BUN_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.BUN_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Force account selection on every login
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Sign out from Firebase - clears the cached Google session
 */
export const signOutFromFirebase = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Firebase sign out error:", error);
  }
};

/**
 * Sign in with Google popup and return the Firebase ID token.
 * Ensures a fresh authentication by signing out first.
 */
export const signInWithGoogle = async (): Promise<string> => {
  // Sign out first to clear any cached/stale auth state
  // This ensures we get a completely fresh authentication
  try {
    if (auth.currentUser) {
      await signOut(auth);
    }
  } catch (e) {
    console.warn("Pre-signin signout failed:", e);
  }
  
  const result = await signInWithPopup(auth, googleProvider);
  // Force a fresh token instead of using cached one
  const idToken = await result.user.getIdToken(true);
  console.log("Got fresh Firebase ID token");
  return idToken;
};
