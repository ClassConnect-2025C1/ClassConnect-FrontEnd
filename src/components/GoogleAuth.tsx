import React from 'react';
import { Alert, TouchableOpacity, Image } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../configs/FirebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const GoogleLogin = () => {
  const navigation = useNavigation();
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId:
      '98403984467-7tu22g1ie8gk8cq7cjcfjlj28r1oug4f.apps.googleusercontent.com',
    expoClientId:
      '98403984467-7tu22g1ie8gk8cq7cjcfjlj28r1oug4f.apps.googleusercontent.com',
    androidClientId:
      '1050877364267-q1t9iqmr18b39ggofpl4dmv3s72k20b4.apps.googleusercontent.com',
    redirectUri: AuthSession.makeRedirectUri({
      useProxy: true,
    }),
  });

  const handleGoogleLogin = async () => {
    const res = await promptAsync();

    if (res?.type === 'success') {
      const { id_token } = res.authentication || {};
      if (id_token) {
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, credential)
          .then(async (userCred) => {
            const { user } = userCred;

            const backendResponse = await fetch(
              'http://192.168.0.14:8000/auth/google',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: user.email,
                  name: user.displayName,
                  picture: user.photoURL,
                }),
              },
            );

            const data = await backendResponse.json();
            if (backendResponse.ok) {
              await AsyncStorage.setItem('token', data.access_token);

              const roleRes = await fetch(
                `http://192.168.0.14:8001/users/profile/${data.user_id}`,
              );
              const profile = await roleRes.json();

              if (profile.role === 'teacher') {
                navigation.navigate('TeacherCourses');
              } else {
                navigation.navigate('StudentCourses');
              }
            } else {
              Alert.alert('Error', 'No se pudo guardar el usuario');
            }
          })
          .catch((err) => {
            console.log(err);
            Alert.alert('Firebase login failed');
          });
      }
    }
  };

  return (
    <TouchableOpacity onPress={handleGoogleLogin}>
      <Image
        source={require('../../assets/images/googlelog.png')}
        style={{ width: 40, height: 40 }}
      />
    </TouchableOpacity>
  );
};

export default GoogleLogin;
