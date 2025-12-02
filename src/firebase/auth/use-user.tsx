
// Use client directive for Firebase client-side code
'use client';

// Import necessary React and Firebase modules
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirebase } from '@/firebase/config';

// Define the shape of the authentication context
interface AuthContextType {
  user: User | null;
  loading: boolean;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

// Define the props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// Create the AuthProvider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the Firebase auth instance
    const { auth } = getFirebase();
    if (!auth) {
        setLoading(false);
        return;
    };
    // Set up a listener for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  // Provide the user and loading state to child components
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook to access the authentication context
export const useUser = () => useContext(AuthContext);
