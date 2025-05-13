import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/axiosInstance';
import { useNavigation } from '@react-navigation/native';
import { AcceptOnlyModal } from '../components/Modals';
import { jwtDecode } from 'jwt-decode';

type AuthContextType = {
  isAuthenticated: boolean;
  loading: boolean;
  shouldRedirectToLogin: boolean;
  setShouldRedirectToLogin: React.Dispatch<React.SetStateAction<boolean>>;
  token: string | null;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
};
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: true,
  shouldRedirectToLogin: false,
  setShouldRedirectToLogin: () => {},
  token: null,
  setToken: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const navigation = useNavigation();

  const checkToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      console.log('Token desde AsyncStorage:', storedToken);

      if (!storedToken) {
        setIsAuthenticated(false);
        setToken(null);
        setLoading(false);
        return;
      }

      const decoded: any = jwtDecode(storedToken);
      const now = Date.now() / 1000;

      if (decoded.exp < now) {
        console.log('Token expirado localmente');
        setIsAuthenticated(false);
        setToken(null);
        await AsyncStorage.removeItem('token');
        setShouldRedirectToLogin(true);
        setLoading(false);
        return;
      }

      await api.get('/auth/protected', {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      setIsAuthenticated(true);
      setToken(storedToken);
    } catch (e) {
      console.log('Token inválido o error al hacer la petición:', e);
      setIsAuthenticated(false);
      setToken(null);
      await AsyncStorage.removeItem('token');
      setShouldRedirectToLogin(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkToken();

    const interval = setInterval(() => {
      checkToken();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (shouldRedirectToLogin) {
      setShowModal(true);
      navigation.navigate('Login');
      setShouldRedirectToLogin(false);
    }
  }, [shouldRedirectToLogin, navigation]);

  return (
    <>
      <AuthContext.Provider
        value={{
          isAuthenticated,
          loading,
          shouldRedirectToLogin,
          setShouldRedirectToLogin,
          token,
          setToken,
        }}
      >
        {children}
      </AuthContext.Provider>

      <AcceptOnlyModal
        visible={showModal}
        message="Your session has expired, please log in again."
        onAccept={() => setShowModal(false)}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};

export const useAuth = () => useContext(AuthContext);
