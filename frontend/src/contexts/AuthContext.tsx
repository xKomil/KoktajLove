// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '@/types/authTypes';
import * as storage from '@/utils/localStorage';
import * as authService from '@/services/authService';

// Keys for localStorage
const TOKEN_KEY = 'koktajlove_authToken';
const USER_KEY = 'koktajlove_userData';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (jwtToken: string, userData: User) => void;
  logout: () => void;
  updateUser: (updatedUserData: User) => void; // For updating user data after profile changes
  refreshUserData: () => Promise<void>; // For refreshing user data from server
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const storedToken = storage.getItem<string>(TOKEN_KEY);
      let storedUser = storage.getItem<User>(USER_KEY);

      if (storedToken) {
        setToken(storedToken);
        
        if (!storedUser) {
          try {
            const currentUser = await authService.getCurrentUser();
            storedUser = currentUser;
            storage.setItem(USER_KEY, currentUser);
          } catch (error) {
            console.warn('Failed to fetch current user with stored token, logging out:', error);
            storage.removeItem(TOKEN_KEY);
            storage.removeItem(USER_KEY);
            setToken(null);
            setUser(null);
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
  }, []);

  const updateUser = useCallback((updatedUserData: User) => {
    setUser(updatedUserData);
    storage.setItem(USER_KEY, updatedUserData);
  }, []);

  const refreshUserData = useCallback(async () => {
    if (token) {
      try {
        const freshUserData = await authService.getCurrentUser();
        updateUser(freshUserData);
      } catch (error) {
        console.error('Failed to refresh user data:', error);
        // Optionally logout if token is invalid
        logout();
      }
    }
  }, [token, updateUser, logout]);

  const isAuthenticated = !!token && !!user;

  const contextValue: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};