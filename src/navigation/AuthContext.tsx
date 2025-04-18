import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setOnTokenExpired } from '../utils/axiosInstance';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';

type AuthContextType = {
  isAuthenticated: boolean;
  loading: boolean;
  setShouldRedirectToLogin: React.Dispatch<React.SetStateAction<boolean>>;
  setTokenExpired: (expired: boolean) => void;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: true,
  setShouldRedirectToLogin: () => {},
  setTokenExpired: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const navigation = useNavigation();

  const checkToken = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      await api.get('/auth/protected');
      setIsAuthenticated(true);
    } catch (e) {
      setIsAuthenticated(false);
      await AsyncStorage.removeItem('token');
      setShouldRedirectToLogin(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkToken();
  }, []);

  useEffect(() => {
    if (shouldRedirectToLogin || tokenExpired) {
      Alert.alert('Sesión expirada', 'Inicia sesión nuevamente');
      navigation.navigate('Login');
      setTokenExpired(false);
    }
  }, [shouldRedirectToLogin, tokenExpired, navigation]);

  useEffect(() => {
    // Conectamos axios con el AuthContext
    setOnTokenExpired(() => () => setTokenExpired(true));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        setShouldRedirectToLogin,
        setTokenExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
