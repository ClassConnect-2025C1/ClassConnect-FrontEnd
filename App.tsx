import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './src/navigation/AuthStack';
import { AuthProvider, useAuth } from './src/navigation/AuthContext';
import { useNavigation } from '@react-navigation/native'; // Importamos useNavigation

const AppContent = () => {
  const { loading, shouldRedirectToLogin } = useAuth();
  const navigation = useNavigation(); // Usamos navigation aquí

  useEffect(() => {
    if (shouldRedirectToLogin) {
      navigation.navigate('Login');
    }
  }, [shouldRedirectToLogin, navigation]);

  if (loading) return null;

  return <AuthStack />;
};

export default function App() {
  return (
    <NavigationContainer>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </NavigationContainer>
  );
}
