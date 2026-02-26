import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  clearError: () => void;
  logout: () => Promise<void>;
}

/** Map Firebase error codes to human-readable messages */
function friendlyAuthError(code: string): string {
  switch (code) {
    case 'auth/unauthorized-domain':
      return 'This domain isn\'t authorized yet. Ask the app owner to add it in Firebase Console → Auth → Settings → Authorized domains.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup. Trying redirect instead...';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed. Tap the button to try again.';
    case 'auth/cancelled-popup-request':
      return 'Another sign-in was already in progress. Try again.';
    case 'auth/network-request-failed':
      return 'Network error — check your internet connection and try again.';
    case 'auth/internal-error':
      return 'Google sign-in failed. If this is your first time, the app owner may need to publish the OAuth consent screen or add you as a test user in Google Cloud Console.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact the app owner.';
    case 'auth/admin-restricted-operation':
      return 'Sign-in is restricted. The app owner needs to enable Google sign-in in Firebase Console.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled. The app owner needs to enable it in Firebase Console → Auth → Sign-in method.';
    default:
      return `Sign-in failed (${code}). Please try again.`;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Handle redirect result (for mobile fallback)
  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      if (err?.code) setAuthError(friendlyAuthError(err.code));
    });
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? 'unknown';
      // If popup was blocked, fall back to redirect flow
      if (code === 'auth/popup-blocked') {
        setAuthError('Popup blocked — redirecting to Google sign-in...');
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr: unknown) {
          const rCode = (redirectErr as { code?: string })?.code ?? 'unknown';
          setAuthError(friendlyAuthError(rCode));
        }
        return;
      }
      setAuthError(friendlyAuthError(code));
    }
  };

  const clearError = () => setAuthError(null);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, authError, signInWithGoogle, clearError, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
