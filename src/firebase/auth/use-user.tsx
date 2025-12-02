
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
  isGuest: boolean;
  setGuestMode: (isGuest: boolean) => void;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isGuest: false, setGuestMode: () => {} });

// Define the props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// Create the AuthProvider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Check session storage for guest mode
    const guestMode = sessionStorage.getItem('isGuest') === 'true';
    if(guestMode) {
      setIsGuest(true);
    }
    
    // Get the Firebase auth instance
    const { auth } = getFirebase();
    if (!auth) {
        setLoading(false);
        return;
    };
    // Set up a listener for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        // If user signs in, they are no longer a guest
        setIsGuest(false);
        sessionStorage.removeItem('isGuest');
      }
      setLoading(false);
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  const setGuestMode = (isGuest: boolean) => {
    if (isGuest) {
        sessionStorage.setItem('isGuest', 'true');
        setIsGuest(true);
    } else {
        sessionStorage.removeItem('isGuest');
        setIsGuest(false);
    }
  }

  // Provide the user and loading state to child components
  return (
    <AuthContext.Provider value={{ user, loading, isGuest, setGuestMode }}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook to access the authentication context
export const useUser = () => useContext(AuthContext);
