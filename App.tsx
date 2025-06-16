import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import AuthStack from './src/navigation/AuthStack';
import { AuthProvider, useAuth } from './src/navigation/AuthContext';
import { useNavigation } from '@react-navigation/native';
import messaging from '@react-native-firebase/messaging';
import { API_URL } from '@env';

// Handler para notificaciones en background
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📱 FCM Background Message:', remoteMessage);
});

const AppContent = () => {
  const { loading, shouldRedirectToLogin } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (shouldRedirectToLogin) {
      navigation.navigate('Login');
    }
  }, [shouldRedirectToLogin, navigation]);

  useEffect(() => {
    const setupFirebaseMessaging = async () => {
      try {
        // Listener para foreground - SOLO MOSTRAR ALERTA
        const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
          console.log('📱 FCM Foreground:', remoteMessage);
          
          Alert.alert(
            remoteMessage.notification?.title || 'New Notification',
            remoteMessage.notification?.body || 'You have a new message',
            [{ text: 'OK' }]
          );
        });

        // Listener para token refresh
        const unsubscribeTokenRefresh = messaging().onTokenRefresh(token => {
          console.log('🔄 FCM Token refreshed:', token);
          updateTokenInBackend(token);
        });

        return () => {
          unsubscribeForeground();
          unsubscribeTokenRefresh();
        };

      } catch (error) {
        console.error('❌ Error setting up Firebase:', error);
      }
    };

    const updateTokenInBackend = async (token: string) => {
      try {
        const userToken = await AsyncStorage.getItem('token');
        if (!userToken) return;

        const decoded = jwtDecode(userToken);
        const userId = decoded.user_id || decoded.sub;
        if (!userId) return;

        await fetch(`${API_URL}/api/users/${userId}/push-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            fcm_token: token,
            device_type: Platform.OS,
          }),
        });
      } catch (error) {
        console.error('❌ Error updating token:', error);
      }
    };

    setupFirebaseMessaging();
  }, [navigation]);

  if (loading) return null;

  return <AuthStack />;
};

export default function App() {
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('✅ Notification permissions granted');
          const token = await messaging().getToken();
          console.log('🔑 FCM token:', token?.substring(0, 30) + '...');
        } else {
          console.log('⚠️ Notification permissions denied');
        }
      } catch (error) {
        console.error('❌ Error initializing Firebase:', error);
      }
    };

    initializeFirebase();
  }, []);

  return (
    <NavigationContainer>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </NavigationContainer>
  );
}