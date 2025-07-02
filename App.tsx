import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import AuthStack from './src/navigation/AuthStack';
import { AuthProvider, useAuth } from './src/navigation/AuthContext';
import { useNavigation } from '@react-navigation/native';
import messaging from '@react-native-firebase/messaging';
import { API_URL } from '@env';
import { NotificationToast } from './src/components/NotificationToast';
import { useNotificationToast } from './src/hooks/useNotificationToast';

// Handler para notificaciones en background
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📱 FCM Background Message:', remoteMessage);
});

const AppContent = () => {
  const { loading, shouldRedirectToLogin } = useAuth();
  const navigation = useNavigation();
  const { isVisible, toastData, showToast, hideToast } = useNotificationToast();

  useEffect(() => {
    if (shouldRedirectToLogin) {
      navigation.navigate('Login');
    }
  }, [shouldRedirectToLogin, navigation]);

  useEffect(() => {
    const setupFirebaseMessaging = async () => {
      try {
        // Listener para foreground - MOSTRAR TOAST
        const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
          console.log('📱 FCM Foreground:', remoteMessage);

          showToast(
            remoteMessage.notification?.title || 'New Notification',
            remoteMessage.notification?.body || 'You have a new message'
          );
        });

        // ➕ NUEVO: Listener para cuando la app está en background y user toca notificación
        const unsubscribeNotificationOpened = messaging().onNotificationOpenedApp(remoteMessage => {
          console.log('🔔 User tapped notification (app in background):', remoteMessage);
          navigateToStudentCourses();
        });

        // ➕ NUEVO: Para cuando la app está cerrada y user toca notificación
        const initialNotification = await messaging().getInitialNotification();
        if (initialNotification) {
          console.log('🔔 User tapped notification (app was closed):', initialNotification);
          navigateToStudentCourses();
        }

        // Listener para token refresh
        const unsubscribeTokenRefresh = messaging().onTokenRefresh(token => {
          console.log('🔄 FCM Token refreshed:', token);
          updateTokenInBackend(token);
        });

        return () => {
          unsubscribeForeground();
          unsubscribeNotificationOpened(); // ➕ NUEVO cleanup
          unsubscribeTokenRefresh();
        };

      } catch (error) {
        console.error('❌ Error setting up Firebase:', error);
      }
    };

    // ➕ NUEVA función para navegar a StudentCourses
    const navigateToStudentCourses = async () => {
      try {
        // Obtener userId del token almacenado
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const decoded = jwtDecode(token);
          const userId = decoded.user_id || decoded.sub;

          navigation.navigate('StudentCourses', { userId: userId });
        }
      } catch (error) {
        console.error('Error navigating to StudentCourses:', error);
      }
    };

    const updateTokenInBackend = async (token: string) => {
      try {
        const userToken = await AsyncStorage.getItem('token');
        if (!userToken) return;

        const decoded = jwtDecode(userToken);
        const userId = decoded.user_id || decoded.sub;
        if (!userId) return;

        await fetch(`${API_URL}/api/notifications/${userId}/push-token`, {
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

  return (
    <>
      <AuthStack />
      <NotificationToast
        visible={isVisible}
        title={toastData.title}
        body={toastData.body}
        onClose={hideToast}
      />
    </>
  );
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