import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Alert } from 'react-native';

const api = axios.create({
  baseURL: 'http://192.168.0.14:8000',
});


api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);


api.interceptors.response.use(
  response => response,
  async error => {
    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data?.detail?.includes('expirado')
    ) {
      await AsyncStorage.removeItem('token');
      Alert.alert('Sesión expirada', 'Inicia sesión nuevamente');
      router.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
