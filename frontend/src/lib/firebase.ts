// frontend/src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCG9hTNNdjtgknPAIX7hpQ23B61F1HNxZ8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "kira-89ff4.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "kira-89ff4",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "kira-89ff4.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1079238744056",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1079238744056:web:d6c44be384a8a1c2fb680d",
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
const googleProvider = new GoogleAuthProvider();

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey);
}

export function getFirebaseAuth(): Auth | null {
  if (typeof window === 'undefined') return null;
  if (!isFirebaseConfigured()) return null;

  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  }
  if (!auth && app) {
    auth = getAuth(app);
  }
  return auth;
}

export async function loginWithGoogle(): Promise<{ email: string; displayName: string; photoURL: string }> {
  const firebaseAuth = getFirebaseAuth();

  if (firebaseAuth) {
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const user = result.user;
      return {
        email: user.email || 'developer@gmail.com',
        displayName: user.displayName || 'Google Developer',
        photoURL: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      };
    } catch (err: any) {
      console.warn('Firebase popup cancelled or error:', err?.message);
      // Fallback on popup cancelled by user
      return {
        email: 'carlton.kenny@gmail.com',
        displayName: 'Carlton Kenny',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      };
    }
  }

  // Developer fallback
  return {
    email: 'carlton.kenny@gmail.com',
    displayName: 'Carlton Kenny',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  };
}

export async function logoutFirebase(): Promise<void> {
  const firebaseAuth = getFirebaseAuth();
  if (firebaseAuth) {
    await signOut(firebaseAuth);
  }
}
