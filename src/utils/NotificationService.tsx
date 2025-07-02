import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import { API_URL } from '@env';

export interface NotificationToken {
  token: string;
  hasPermission: boolean;
}

export class NotificationService {

  // Solicitar permisos de notificación
  static async requestNotificationPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message: 'This app needs notification permissions to send you updates',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          const authStatus = await messaging().requestPermission();
          return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        }
      }
      return true;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Obtener FCM token
  static async getFCMToken(): Promise<NotificationToken> {
    try {
      const hasPermission = await this.requestNotificationPermission();

      if (!hasPermission) {
        console.log('⚠️ Notification permissions not granted');
        return { token: '', hasPermission: false };
      }

      const token = await messaging().getToken();
      //console.log('🔑 FCM Token obtained:', token);

      return { token, hasPermission: true };
    } catch (error) {
      //console.error('❌ Error getting FCM token:', error);
      return { token: '', hasPermission: false };
    }
  }

  // Enviar token al backend
  static async sendTokenToBackend(
    fcmToken: string,
    userId: string,
    authToken: string
  ): Promise<boolean> {
    if (!userId || !fcmToken) {
      console.log('⚠️ Missing userId or fcmToken for backend');
      return false;
    }

    try {

      const response = await fetch(`${API_URL}/api/notifications/${userId}/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          fcm_token: fcmToken,
          device_type: Platform.OS,
          device_info: {
            platform: Platform.OS,
            version: Platform.Version,
          }
        }),
      });

      if (response.ok) {
        console.log('✅ FCM token sent to backend successfully');
        return true;
      } else {
        const errorText = await response.text();
        //console.error('❌ Failed to send FCM token to backend:', errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending FCM token to backend:', error);
      return false;
    }
  }

  // Configurar listeners de notificaciones
  static setupNotificationListeners(
    onForegroundMessage?: (message: any) => void
  ) {


    // Listener para notificaciones en primer plano
    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      console.log('📱 FCM message received in foreground:', remoteMessage);

      if (onForegroundMessage) {
        onForegroundMessage(remoteMessage);
      } else {
        console.log('No foreground message handler provided');
      }
    });

    // Listener para cambios en el token
    const unsubscribeOnTokenRefresh = messaging().onTokenRefresh(token => {
      console.log('🔄 FCM Token refreshed:', token);
      // Aquí podrías actualizar el token en el backend automáticamente
    });

    // Función de cleanup
    return () => {
      unsubscribeOnMessage();
      unsubscribeOnTokenRefresh();
    };
  }

  // Función completa para inicializar todo
  static async initialize(
    userId: string,
    authToken: string,
    onForegroundMessage?: (message: any) => void
  ): Promise<NotificationToken> {
    try {
      // 1. Obtener token FCM
      const tokenResult = await this.getFCMToken();

      if (tokenResult.hasPermission && tokenResult.token) {
        // 2. Enviar token al backend
        await this.sendTokenToBackend(tokenResult.token, userId, authToken);

        // 3. Configurar listeners
        this.setupNotificationListeners(onForegroundMessage);
      }

      return tokenResult;
    } catch (error) {
      console.error('❌ Error initializing notification service:', error);
      return { token: '', hasPermission: false };
    }
  }
}