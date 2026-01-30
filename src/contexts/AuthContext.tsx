import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/storage';
import { onAuthChange, signIn as fbSignIn, signUp as fbSignUp, signOut as fbSignOut, getUserData, AppUser } from '@/services/firebaseService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: Partial<User>, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        // Get user data from Firestore
        const userData = await getUserData(firebaseUser.uid);
        if (userData) {
          setUser(userData as any);
        }
      } else {
        setUser(null);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const userData = await fbSignIn(email, password);
      setUser(userData as any);
      console.log('✅ Login successful:', userData.email);
      return true;
    } catch (error: any) {
      console.error('❌ Login failed:', error.message);
      return false;
    }
  };

  const signup = async (userData: Partial<User>, password: string): Promise<boolean> => {
    try {
      const newUser = await fbSignUp(
        userData.email || '',
        password,
        userData.name || '',
        userData.role || 'passenger'
      );
      setUser(newUser as any);
      console.log('✅ Signup successful:', newUser.email);
      return true;
    } catch (error: any) {
      console.error('❌ Signup failed:', error.code, error.message);
      // Log specific Firebase errors for debugging
      if (error.code === 'auth/email-already-in-use') {
        console.error('Email already registered');
      } else if (error.code === 'auth/invalid-email') {
        console.error('Invalid email format');
      } else if (error.code === 'auth/weak-password') {
        console.error('Password too weak');
      }
      return false;
    }
  };

  const logout = async () => {
    try {
      await fbSignOut();
      setUser(null);
      console.log('✅ Logout successful');
    } catch (error: any) {
      console.error('❌ Logout failed:', error.message);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      // TODO: Add Firestore update function here
      console.log('✅ User updated locally');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
