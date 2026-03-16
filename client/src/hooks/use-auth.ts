import { create } from 'zustand';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface AuthState {
  user: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isRestoring: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

export const useAuth = create<AuthState>((set) => {
  // Listen for auth state changes — handles session restoration automatically
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Ensure user doc exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName || '',
        avatarUrl: user.photoURL || '',
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
    set({ user, isLoading: false, isAuthenticated: !!user, isRestoring: false });
  });

  return {
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isRestoring: true,

    login: async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password);
    },

    register: async (email, password, name) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await setDoc(doc(db, 'users', cred.user.uid), {
        email,
        displayName: name,
        avatarUrl: '',
        plan: 'free',
        defaultUnit: 'px',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },

    loginWithGoogle: async () => {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await setDoc(doc(db, 'users', cred.user.uid), {
        email: cred.user.email,
        displayName: cred.user.displayName || '',
        avatarUrl: cred.user.photoURL || '',
        plan: 'free',
        defaultUnit: 'px',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    },

    logout: async () => {
      await firebaseSignOut(auth);
    },

    resetPassword: async (email) => {
      await sendPasswordResetEmail(auth, email);
    },

    updateName: async (name) => {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      await updateProfile(user, { displayName: name });
      await setDoc(doc(db, 'users', user.uid), {
        displayName: name,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      set({ user: { ...user } as FirebaseUser });
    },

    updateEmail: async (email) => {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      await firebaseUpdateEmail(user, email);
      await setDoc(doc(db, 'users', user.uid), {
        email,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      set({ user: { ...user } as FirebaseUser });
    },

    updatePassword: async (newPassword) => {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      await firebaseUpdatePassword(user, newPassword);
    },
  };
});
