import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebase';
import type { User, SignupData, LoginData } from '../types/user.types';
import { getUserColor } from '../utils/colors';

/**
 * Convert Firebase User to our User type
 */
const convertFirebaseUser = (firebaseUser: FirebaseUser): User => {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous',
    color: getUserColor(firebaseUser.uid),
    createdAt: Date.now(),
  };
};

/**
 * Sign up a new user with email, password, and display name
 */
export const signup = async (data: SignupData): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    // Update display name
    await updateProfile(userCredential.user, {
      displayName: data.displayName,
    });

    return convertFirebaseUser(userCredential.user);
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Log in an existing user
 */
export const login = async (data: LoginData): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    return convertFirebaseUser(userCredential.user);
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Log out the current user
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error('Failed to log out. Please try again.');
  }
};

/**
 * Sign in with Google
 */
export const loginWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return convertFirebaseUser(userCredential.user);
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Get the current authenticated user
 */
export const getCurrentUser = (): User | null => {
  const firebaseUser = auth.currentUser;
  return firebaseUser ? convertFirebaseUser(firebaseUser) : null;
};

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChanged = (
  callback: (user: User | null) => void
): (() => void) => {
  return firebaseOnAuthStateChanged(auth, (firebaseUser) => {
    callback(firebaseUser ? convertFirebaseUser(firebaseUser) : null);
  });
};

/**
 * Convert Firebase auth error codes to user-friendly messages
 */
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please log in instead.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later.';
    default:
      return 'An error occurred. Please try again.';
  }
};

