import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [googleClientId, setGoogleClientId] = useState(
    import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  );

  // Fetch current authenticated user session via HTTP-only cookie
  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch public Google Client ID configuration if not provided in build env
  const fetchAuthConfig = useCallback(async () => {
    try {
      const res = await api.get('/auth/config');
      if (res.data?.success && res.data?.googleClientId) {
        setGoogleClientId(res.data.googleClientId);
      }
    } catch {
      // Keep existing env value
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
    fetchAuthConfig();
  }, [fetchCurrentUser, fetchAuthConfig]);

  // Google OAuth Login Action
  const loginWithGoogle = async ({ credential, code, redirectUri }) => {
    setError(null);
    try {
      const res = await api.post('/auth/google', { credential, code, redirectUri });
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      return { success: false, error: 'Google authentication response missing user data.' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Google authentication failed.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // Logout action (clears cookie)
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Continue client cleanup anyway
    } finally {
      setUser(null);
    }
  };

  // Update user preferences
  const updatePreferences = async (newPrefs) => {
    try {
      const res = await api.put('/auth/preferences', newPrefs);
      if (res.data?.success) {
        setUser(prev => ({
          ...prev,
          preferences: res.data.preferences
        }));
        return { success: true };
      }
      return { success: false, error: 'Failed to update preferences.' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update preferences.';
      return { success: false, error: msg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        googleClientId,
        loginWithGoogle,
        logout,
        updatePreferences,
        refreshUser: fetchCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
