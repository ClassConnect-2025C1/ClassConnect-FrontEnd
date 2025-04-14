import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/axiosInstance';
import { useNavigation } from '@react-navigation/native';  // Usamos useNavigation aquí

type AuthContextType = {
  isAuthenticated: boolean;
  loading: boolean;
  shouldRedirectToLogin: boolean; // Agregamos este estado
  setShouldRedirectToLogin: React.Dispatch<React.SetStateAction<boolean>>; // Función para actualizar el estado
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: true,
  shouldRedirectToLogin: false, // Inicializamos el estado
  setShouldRedirectToLogin: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false); // Estado de redirección
  const navigation = useNavigation();  // Usamos navigation aquí dentro del contexto

  const checkToken = async () => {
    const token = await AsyncStorage.getItem('token');

    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      await api.get('/auth/protected');  // Si no expira el token, estamos bien
      setIsAuthenticated(true);
    } catch (e) {
      setIsAuthenticated(false);
      await AsyncStorage.removeItem('token');
      setShouldRedirectToLogin(true); // Marcamos que necesitamos redirigir
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkToken();

    const interval = setInterval(() => {
      checkToken();  // Chequear el token cada cierto tiempo
    }, 11000);  // Puedes ajustar este intervalo si es necesario

    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, shouldRedirectToLogin, setShouldRedirectToLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
