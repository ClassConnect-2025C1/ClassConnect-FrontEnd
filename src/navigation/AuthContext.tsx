import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/axiosInstance';
import { useNavigation } from '@react-navigation/native';

type AuthContextType = {
  isAuthenticated: boolean;
  loading: boolean;
  shouldRedirectToLogin: boolean;
  setShouldRedirectToLogin: React.Dispatch<React.SetStateAction<boolean>>;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: true,
  shouldRedirectToLogin: false,
  setShouldRedirectToLogin: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false);
  const navigation = useNavigation();

  const checkToken = async () => {
    const token = await AsyncStorage.getItem('token');

    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      // Realizamos una llamada a una ruta protegida para verificar la validez del token
      await api.get('/auth/protected');
      setIsAuthenticated(true);
    } catch (e) {
      setIsAuthenticated(false);
      await AsyncStorage.removeItem('token');
      setShouldRedirectToLogin(true); // Establecemos la necesidad de redirigir al login
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Al montar el componente, chequeamos si el token es válido
    checkToken();

    // Usamos un intervalo para revisar cada 10 segundos si el token sigue siendo válido
    const interval = setInterval(() => {
      checkToken();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        shouldRedirectToLogin,
        setShouldRedirectToLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

