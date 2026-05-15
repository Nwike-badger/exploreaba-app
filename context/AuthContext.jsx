import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { TOKEN_KEY } from '@/services/axiosConfig';
import { toast } from '@/utils/toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async (showToast = true) => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setUser(null);
    setIsAuthenticated(false);
    if (showToast) {
      toast("You've been signed out. See you soon! 👋", { duration: 3000 });
    }
    // Navigation handled by the calling screen via expo-router
  }, []);

  const login = useCallback(async (token, userData = null) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setIsAuthenticated(true);

    if (userData) {
      setUser(userData);
    } else {
      try {
        const res = await api.get('/v1/users/me');
        setUser(res.data);
      } catch (error) {
        console.error('Failed to fetch user after login:', error);
        toast.error("We couldn't load your profile right now. Please try again.");
      }
    }
  }, []);

  // Cold-start session restore
  useEffect(() => {
    const initAuth = async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        try {
          const res = await api.get('/v1/users/me');
          setUser(res.data);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auth check failed:', error);
          logout(false);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [logout]);

  const updateUser = useCallback((newUserData) => {
    setUser(newUserData);
  }, []);

  const contextValue = useMemo(
    () => ({ user, isAuthenticated, loading, login, logout, updateUser }),
    [user, isAuthenticated, loading, login, logout, updateUser]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);