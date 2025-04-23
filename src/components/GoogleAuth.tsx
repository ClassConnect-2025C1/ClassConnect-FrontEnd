// GoogleAuth.ts
import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

export const handleGoogleLoginCallback = async (
  idToken: string,
  navigation: any,
) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ google_token: idToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log('❌ Error al loguear en backend:', data.detail);
      return;
    }

    const backendToken = data.access_token;
    await AsyncStorage.setItem('token', backendToken);

    const decoded: any = jwtDecode(backendToken);
    const userId = decoded.sub;

    const profileResponse = await fetch(
      `${API_URL}/api/users/profile/${userId}`,
    );

    if (!profileResponse.ok) {
      console.log('❌ Error al obtener el perfil');
      return;
    }

    const userProfile = await profileResponse.json();
    const userRole = userProfile.role;

    navigation.navigate(
      userRole === 'teacher' ? 'TeacherCourses' : 'StudentCourses',
    );
  } catch (error: any) {
    console.error('Error en login con Google:', error.message);
  }
};
