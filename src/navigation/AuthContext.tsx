import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/axiosInstance';
import { useNavigation } from '@react-navigation/native';
import { AcceptOnlyModal } from '../components/Modals';
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
  const [showModal, setShowModal] = useState(false);

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
        }}
      >
        {children}
      </AuthContext.Provider>

      <AcceptOnlyModal
        visible={showModal}
        message="
Your session has expired, please log in again."
        onAccept={() => setShowModal(false)}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};
export const useAuth = () => useContext(AuthContext);
