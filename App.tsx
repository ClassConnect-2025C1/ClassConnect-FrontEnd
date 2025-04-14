import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './src/navigation/AuthStack';
import { AuthProvider,useAuth } from './src/navigation/AuthContext';

const AppContent = () => {
  const { loading } = useAuth();

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
