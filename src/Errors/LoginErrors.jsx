// components/LoginErrors.js
import Toast from 'react-native-toast-message';

export const showLoginErrorToast = (message) => {
  Toast.show({
    type: 'error',
    position: 'bottom',
    text1: 'Error',
    text2: message,
    visibilityTime: 4000, // Muestra el toast durante 4 segundos
  });
};
