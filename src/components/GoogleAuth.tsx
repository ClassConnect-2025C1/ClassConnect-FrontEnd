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

    // ✅ Extraer info del usuario para pasarla a la pantalla de selección
    const userInfo = {
      name: userCredential.user.displayName,
      email: userCredential.user.email,
      photo: userCredential.user.photoURL,
    };

    // ✅ Primero verificar si el usuario ya existe
    const checkUserResponse = await fetch(`${API_URL}/api/auth/check-google-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ google_token: firebaseIdToken }),
    });

    if (checkUserResponse.ok) {
      // ✅ Usuario ya existe, hacer login directo
      const data = await checkUserResponse.json();
      const backendToken = data.access_token;
      await AsyncStorage.setItem('token', backendToken);

      const decoded = jwtDecode(backendToken);
      const user_id = decoded.user_id;

      // Obtener el perfil para saber el rol
      const profileResponse = await fetch(
        `${API_URL}/api/users/profile/${user_id}`,
        {
          headers: { Authorization: `Bearer ${backendToken}` },
        }
      );

      if (profileResponse.ok) {
        const userProfile = await profileResponse.json();
        const userRole = userProfile.role;

        navigation.navigate(
          userRole === 'teacher' ? 'TeacherCourses' : 'StudentCourses',
          { userId: user_id },
        );
      }
    } else {
      // ✅ Usuario nuevo, ir a selección de rol
      navigation.navigate('RoleSelection', {
        googleToken: firebaseIdToken,
        userInfo: userInfo,
      });
    }

  } catch (error: any) {
    console.error('Error en login con Google:', error.message);
  }
};