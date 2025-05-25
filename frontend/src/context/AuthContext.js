import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component that wraps the app and makes auth object available to any child component that calls useAuth()
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const user = authAPI.getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await authAPI.login({ email, password });
      setCurrentUser(user);
      return user;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authAPI.register(userData);
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    authAPI.logout();
    setCurrentUser(null);
  };

  // Password reset request
  const forgotPassword = async (email) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authAPI.forgotPassword(email);
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to process password reset request.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Reset password with token
  const resetPassword = async (token, newPassword) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authAPI.resetPassword(token, newPassword);
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to reset password.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedUser = await authAPI.updateProfile(userData);
      setCurrentUser(prev => ({ ...prev, ...updatedUser }));
      return updatedUser;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update profile.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return currentUser?.roles?.includes(role) || false;
  };

  // Value object that will be passed to consumers of this context
  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    hasRole,
    isAdmin: () => hasRole('admin'),
    isDoctor: () => hasRole('doctor'),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};