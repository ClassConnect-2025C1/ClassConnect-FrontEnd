import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '@env';
const api = axios.create({
  baseURL: `${API_URL}/api`,
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data?.detail?.includes('expirado')
    ) {
      await AsyncStorage.removeItem('token');
    }
    return Promise.reject(error);
  },
);

export default api;
