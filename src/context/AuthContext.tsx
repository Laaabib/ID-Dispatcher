import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  role: 'admin' | 'user' | 'admin_approver' | 'it_approver' | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmployeeId: (employeeId: string) => Promise<void>;
  registerWithEmployeeId: (employeeId: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'user' | 'admin_approver' | 'it_approver' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            let currentRole = userDoc.data().role;
            // Force update role if they are the designated approvers
            if (firebaseUser.email === '100001@padmaawt.internal' && currentRole !== 'admin_approver') {
              currentRole = 'admin_approver';
              await updateDoc(userDocRef, { role: currentRole });
            } else if (firebaseUser.email === '140001@padmaawt.internal' && currentRole !== 'admin') {
              currentRole = 'admin';
              await updateDoc(userDocRef, { role: currentRole });
            } else if (firebaseUser.email === 'padmaawtit@gmail.com' && currentRole !== 'admin') {
              currentRole = 'admin';
              await updateDoc(userDocRef, { role: currentRole });
            }
            setRole(currentRole);
          } else {
            // Create new user
            let newUserRole = 'user';
            if (firebaseUser.email === 'padmaawtit@gmail.com') {
              newUserRole = 'admin';
            } else if (firebaseUser.email === '140001@padmaawt.internal') {
              newUserRole = 'admin';
            } else if (firebaseUser.email === '100001@padmaawt.internal') {
              newUserRole = 'admin_approver';
            }
            
            await setDoc(userDocRef, {
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Unknown User',
              email: firebaseUser.email,
              role: newUserRole,
              createdAt: new Date().toISOString()
            });
            setRole(newUserRole as any);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'users');
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const DUMMY_PASSWORD = 'PadmaAwt-NoPass-2026!';

  const loginWithEmployeeId = async (employeeId: string) => {
    const email = `${employeeId.toLowerCase()}@padmaawt.internal`;
    try {
      await signInWithEmailAndPassword(auth, email, DUMMY_PASSWORD);
    } catch (error) {
      console.error('Employee login failed:', error);
      throw error;
    }
  };

  const registerWithEmployeeId = async (employeeId: string, name: string) => {
    const email = `${employeeId.toLowerCase()}@padmaawt.internal`;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, DUMMY_PASSWORD);
      await updateProfile(userCredential.user, { displayName: name });
      
      // The onAuthStateChanged listener will handle creating the user document
    } catch (error) {
      console.error('Employee registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, loginWithEmployeeId, registerWithEmployeeId, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
