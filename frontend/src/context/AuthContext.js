import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Create context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configure axios defaults
  // Use relative URL in production, localhost in development
  axios.defaults.baseURL = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:5000/api';
  
  // Set auth token for all requests if available
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
    }
  }, [token]);

  // Load user data if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('/users/profile');
        setUser(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading user:', err);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setError('Authentication failed. Please login again.');
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Register user
  const register = async (userData) => {
    try {
      setLoading(true);
      const res = await axios.post('/users/register', userData);
      
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      
      toast.success('Registration successful!');
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      const res = await axios.post('/users/login', { email, password });
      
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      
      toast.success('Login successful!');
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    toast.info('You have been logged out');
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      const res = await axios.put('/users/profile', userData);
      
      setUser(res.data.user);
      
      toast.success('Profile updated successfully!');
      return true;
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
      toast.error(err.response?.data?.message || 'Failed to update profile. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Generate blockchain keys
  const generateBlockchainKeys = async () => {
    try {
      setLoading(true);
      const res = await axios.post('/users/generate-keys');
      
      // Update user with new blockchain keys
      const updatedUser = { ...user, hasBlockchainKeys: true };
      setUser(updatedUser);
      
      toast.success('Blockchain keys generated successfully!');
      return res.data.publicKey;
    } catch (err) {
      console.error('Generate blockchain keys error:', err);
      setError(err.response?.data?.message || 'Failed to generate blockchain keys. Please try again.');
      toast.error(err.response?.data?.message || 'Failed to generate blockchain keys. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Verify NID
  const verifyNID = async (nidNumber, fullName) => {
    try {
      setLoading(true);
      const res = await axios.post('/users/verify-nid', { nidNumber, fullName });
      
      if (res.data.verified) {
        toast.success('NID verification successful!');
      } else {
        toast.error('NID verification failed. Please check your information.');
      }
      
      return res.data;
    } catch (err) {
      console.error('NID verification error:', err);
      setError(err.response?.data?.message || 'NID verification failed. Please try again.');
      toast.error(err.response?.data?.message || 'NID verification failed. Please try again.');
      return { verified: false, message: 'Verification failed' };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile,
        generateBlockchainKeys,
        verifyNID,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
