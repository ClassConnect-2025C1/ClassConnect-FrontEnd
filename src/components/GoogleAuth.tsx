// GoogleAuth.ts
import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../configs/FirebaseConfig';

export const handleGoogleLoginCallback = async (
  idToken: string,
  navigation: any,
) => {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    const firebaseIdToken = await userCredential.user.getIdToken();

    const response = await fetch(`${API_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ google_token: firebaseIdToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log('❌ Error al loguear en backend:', data.detail);
      return;
    }

    const backendToken = data.access_token;
    await AsyncStorage.setItem('token', backendToken);

    const decoded: any = jwtDecode(backendToken);
    const user_id = decoded.user_id;

    const profileResponse = await fetch(
      `${API_URL}/api/users/profile/${user_id}`,
    );

    if (!profileResponse.ok) {
      console.log('❌ Error al obtener el perfil:', profileResponse.status);
      console.log('❌ Detalle:', profileResponse.statusText);
      return;
    }

    const userProfile = await profileResponse.json();
    const userRole = userProfile.role;

    navigation.navigate(
      userRole === 'teacher' ? 'TeacherCourses' : 'StudentCourses',
      { userId: user_id },
    );
  } catch (error: any) {
    console.error('Error en login con Google:', error.message);
  }
};
