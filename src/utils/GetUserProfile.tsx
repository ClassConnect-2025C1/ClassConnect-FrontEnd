import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { API_URL } from '@env';

export const getUserProfileData = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) return null;

    const decoded = jwtDecode(token);
    const userId = decoded.user_id || decoded.sub;

    const response = await fetch(`${API_URL}/api/users/profile/${userId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;

    const userProfile = await response.json();

    return {
      userId,
      email: userProfile.email,
      name: userProfile.name,
      lastName: userProfile.last_name,
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};
