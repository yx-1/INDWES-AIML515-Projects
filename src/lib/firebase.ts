import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import { SearchRecord, UserProfile } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Test Firestore connection on boot
export async function testConnection() {
  try {
    if (!db) return;
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    // Non-blocking notice so the app functions seamlessly in local/offline modes
    console.warn("Firestore connection check notice:", error?.message || error);
  }
}

// Convert Firebase User to UserProfile
export function mapFirebaseUser(user: User): UserProfile {
  return {
    id: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'Permit Professional',
    email: user.email || '',
    avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName || user.email || 'User')}&backgroundColor=0284c7`,
    role: 'Small Residential Contractor'
  };
}

// Google Sign-In with real popup
export async function signInWithGoogle(): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return mapFirebaseUser(result.user);
  } catch (error: any) {
    console.error("Firebase Google Sign-In error:", error);
    let friendlyMessage = "Failed to sign in with Google. Please try again.";
    if (error.code === 'auth/popup-closed-by-user') {
      friendlyMessage = "Sign-in was cancelled before completing. Please try again.";
    } else if (error.code === 'auth/popup-blocked') {
      friendlyMessage = "The Google sign-in popup was blocked by your browser. Please allow popups or open in a new tab.";
    } else if (error.code === 'auth/cancelled-popup-request') {
      friendlyMessage = "Only one popup request is allowed at a time.";
    } else if (error.code === 'auth/network-request-failed') {
      friendlyMessage = "Network error. Please check your internet connection and try again.";
    } else if (error.message) {
      friendlyMessage = error.message;
    }
    throw new Error(friendlyMessage);
  }
}

// Sign out
export async function logOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn("Firebase sign out notice:", err);
  }
}

// Subscribe to auth state changes safely
export function subscribeToAuth(callback: (user: UserProfile | null) => void) {
  try {
    return onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (firebaseUser) {
          callback(mapFirebaseUser(firebaseUser));
        } else {
          callback(null);
        }
      },
      (error) => {
        console.warn("Firebase Auth listener notice:", error?.message || error);
        callback(null);
      }
    );
  } catch (err) {
    console.warn("Failed to subscribe to auth:", err);
    callback(null);
    return () => {};
  }
}

// Save search to Firestore under /users/{userId}/searches/{searchId}
export async function saveSearchRecordToFirestore(userId: string, record: SearchRecord): Promise<void> {
  if (!userId) return;
  try {
    const searchRef = doc(db, 'users', userId, 'searches', record.id);
    // Sanitize any undefined values before saving to Firestore
    const dataToSave = JSON.parse(JSON.stringify({
      ...record,
      userId,
      updatedAt: Date.now()
    }));
    await setDoc(searchRef, dataToSave, { merge: true });
  } catch (err) {
    console.error("Error saving search to Firestore:", err);
    throw err;
  }
}

// Fetch searches for authenticated user from Firestore
export async function fetchUserSearchesFromFirestore(userId: string): Promise<SearchRecord[]> {
  if (!userId) return [];
  try {
    const searchesCol = collection(db, 'users', userId, 'searches');
    // Order by timestamp descending
    const q = query(searchesCol, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const results: SearchRecord[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      results.push(data as SearchRecord);
    });
    return results;
  } catch (err: any) {
    console.error("Error fetching user searches from Firestore:", err);
    // If index is building or orderBy fails, fallback to simple fetch
    try {
      const fallbackSnapshot = await getDocs(collection(db, 'users', userId, 'searches'));
      const fallbackResults: SearchRecord[] = [];
      fallbackSnapshot.forEach((docSnap) => {
        fallbackResults.push(docSnap.data() as SearchRecord);
      });
      return fallbackResults.sort((a, b) => b.timestamp - a.timestamp);
    } catch (fallbackErr) {
      console.error("Fallback fetch failed:", fallbackErr);
      return [];
    }
  }
}

// Delete search record from Firestore
export async function deleteSearchRecordFromFirestore(userId: string, searchId: string): Promise<void> {
  if (!userId || !searchId) return;
  try {
    const searchRef = doc(db, 'users', userId, 'searches', searchId);
    await deleteDoc(searchRef);
  } catch (err) {
    console.error("Error deleting search from Firestore:", err);
    throw err;
  }
}

// Save user feedback to Firestore under /feedback/{feedbackId} and /users/{userId}/searches/{searchId}
export async function saveFeedbackToFirestore(
  userId: string,
  searchId: string,
  rating: 'helpful' | 'not_helpful',
  timestamp: number
): Promise<void> {
  try {
    const feedbackId = `fb_${searchId}_${timestamp}`;
    const feedbackRef = doc(db, 'feedback', feedbackId);
    await setDoc(feedbackRef, {
      id: feedbackId,
      userId: userId || 'anonymous',
      searchId,
      rating,
      timestamp
    });

    // If user is authenticated, also merge the feedback status into their saved search record
    if (userId && userId !== 'anonymous') {
      const searchRef = doc(db, 'users', userId, 'searches', searchId);
      await setDoc(searchRef, {
        feedback: {
          rating,
          submittedAt: timestamp
        }
      }, { merge: true });
    }
  } catch (err: any) {
    console.error("Error saving feedback to Firestore:", err);
    throw new Error(err.message || "Failed to save feedback to Firestore.");
  }
}

