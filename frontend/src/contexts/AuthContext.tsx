// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '@/types/authTypes';
import * as storage from '@/utils/localStorage';
import * as authService from '@/services/authService'; // For fetching user on token refresh

// Keys for localStorage
const TOKEN_KEY = 'koktajlove_authToken';
const USER_KEY = 'koktajlove_userData';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean; // For initial session loading
  isAuthenticated: boolean;
  login: (jwtToken: string, userData: User) => void;
  logout: () => void;
  // updateUser: (updatedUserData: Partial<User>) => void; // Optional: if user data can change
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // True until initial auth check is done

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const storedToken = storage.getItem<string>(TOKEN_KEY);
      let storedUser = storage.getItem<User>(USER_KEY);

      if (storedToken) {
        setToken(storedToken);
        // Optionally, verify token with backend and fetch fresh user data
        // This is good practice in case user details (like roles) have changed
        // or if the token is stale/invalidated on the server.
        if (!storedUser) { // If user data is not in LS, try to fetch it
            try {
                // This assumes your apiClient is set up to use the token from localStorage
                // or you might need to pass it explicitly if this runs before apiClient is fully configured.
                // For simplicity, let's assume apiClient will pick up the token if set by setToken.
                const currentUser = await authService.getCurrentUser(); // Needs a service to get current user
                storedUser = currentUser;
                storage.setItem(USER_KEY, currentUser);
            } catch (error) {
                console.warn('Failed to fetch current user with stored token, logging out:', error);
                storage.removeItem(TOKEN_KEY);
                storage.removeItem(USER_KEY);
                setToken(null);
                setUser(null);
                // No return here, allow setIsLoading(false) to run
            }
        }
        setUser(storedUser);
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = useCallback((jwtToken: string, userData: User) => {
    storage.setItem(TOKEN_KEY, jwtToken);
    storage.setItem(USER_KEY, userData);
    setToken(jwtToken);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    storage.removeItem(TOKEN_KEY);
    storage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    // Optionally: redirect to login page or clear other app state
  }, []);

  // const updateUser = useCallback((updatedUserData: Partial<User>) => {
  //   setUser(prevUser => {
  //     if (prevUser) {
  //       const newUser = { ...prevUser, ...updatedUserData };
  //       storage.setItem(USER_KEY, newUser);
  //       return newUser;
  //     }
  //     return null;
  //   });
  // }, []);

  const isAuthenticated = !!token && !!user;

  const contextValue: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    // updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};