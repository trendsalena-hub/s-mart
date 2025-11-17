import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/config.js'; // FIX: Corrected path

// 1. Create the Context
const AuthContext = createContext();

// 2. Create a custom hook to use the context easily
export const useAuth = () => {
  return useContext(AuthContext);
};

// 3. Create the Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // FIX: Removed extra "=" sign
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This listener checks for changes in auth state (login/logout)
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup the listener when the component unmounts
    return unsubscribe;
  }, []);

  // 4. Define the values to be shared
  const value = {
    user,
    loading,
    // You can add other auth functions here later, like login or register
  };

  // 5. Return the provider, wrapping the children
  // We don't render anything until the initial loading is done
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};