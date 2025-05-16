import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { showLoginErrorToast } from '../Errors/LoginErrors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { handleGoogleLoginCallback } from '../components/GoogleAuth';
import { AcceptOnlyModal, AcceptRejectModal } from '../components/Modals';
import { API_URL } from '@env';
import { useAuthRequest } from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { AuthContext } from '../navigation/AuthContext';
WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const [generalError, setGeneralError] = useState('');
  const [showGeneralErrorModal, setShowGeneralErrorModal] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [googleLoginPressed, setGoogleLoginPressed] = useState(false);
  const { token, setToken } = useContext(AuthContext);

  const [request, response, promptAsync] = useAuthRequest({
    androidClientId:
      '98403984467-b7t9npmhl4bc1aa6tnrsh8hg4esi4mem.apps.googleusercontent.com',
    webClientId:
      '98403984467-7tu22g1ie8gk8cq7cjcfjlj28r1oug4f.apps.googleusercontent.com',
    redirectUri: AuthSession.makeRedirectUri({
      scheme: 'com.classconnect1.app',
    }),
    responseType: 'id_token',
  });

  useEffect(() => {
    if (googleLoginPressed && response?.type === 'success') {
      console.log('Google response:', response);
      const { id_token } = response.params;
      console.log('Google ID Token:', id_token);
      if (id_token) {
        handleGoogleLoginCallback(id_token, navigation);
      } else {
        console.warn('No id_token in Google response:', response);
      }
      setGoogleLoginPressed(false);
    }
  }, [response, googleLoginPressed]);

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');
    let valid = true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Email is invalid');
      valid = false;
    }

    if (password.length < 4) {
      setPasswordError('password is not correct');
      valid = false;
    }

    if (!valid) return;

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('token', data.access_token);
        setToken(data.access_token);

        const decodedToken: any = jwtDecode(data.access_token);
        const user_id = decodedToken.user_id;

        console.log('El token que seteo es:', data.access_token);
        setToken(data.access_token);

        try {
          const profileResponse = await fetch(
            `${API_URL}/api/users/profile/${user_id}`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${data.access_token}`,
              },
            },
          );

          if (!profileResponse.ok) {
            showLoginErrorToast('Error fetching profile');
            return;
          }

          const userProfile = await profileResponse.json();
          const userRole = userProfile.role;

          if (userRole === 'teacher') {
            navigation.navigate('TeacherCourses');
          } else {
            navigation.navigate('StudentCourses', { userId: user_id });
          }
        } catch (profileError) {
          console.error('Error fetching user profile:', profileError);
          setGeneralError('An error occurred. Please try again later.');
          setShowGeneralErrorModal(true);
        }
      } else {
        console.log('la data detail', data.detail);

        const detailMsg = data.detail?.detail || data.detail;
        if (
          typeof detailMsg === 'string' &&
          detailMsg.toLowerCase().includes('invalid email')
        ) {
          setEmailError('Email is not registered');
        } else if (detailMsg === 'Invalid password') {
          setPasswordError('Invalid password');
        } else {
          console.log('la data detail', detailMsg);
          setModalMessage(detailMsg);
          setShowModal(true);
        }
      }
    } catch (error) {
      console.error('Error during login:', error);
      setGeneralError('An error occurred. Please try again later.');
      setShowGeneralErrorModal(true);
    }
  };

  return (
    <View style={styles.container}>
      <AcceptOnlyModal
        visible={showModal}
        message={modalMessage}
        onAccept={() => setShowModal(false)}
        onClose={() => setShowModal(false)}
      />

      <AcceptOnlyModal
        visible={showGeneralErrorModal}
        message={generalError}
        onAccept={() => setShowGeneralErrorModal(false)}
        onClose={() => setShowGeneralErrorModal(false)}
      />

      <View style={styles.topHalf}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
        />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Log in to your account</Text>

        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError('');
          }}
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        <TextInput
          placeholder="Password"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordError('');
          }}
        />
        {passwordError ? (
          <Text style={styles.errorText}>{passwordError}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.loginButton}
          onPress={async () => {
            await handleLogin();
          }}
        >
          <Text style={styles.loginButtonText}>Log in</Text>
        </TouchableOpacity>

        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('PasswordRecovery')}
          >
            <Text style={styles.bottomLink}>
              Forgot your password?{' '}
              <Text style={styles.signUp}>Click here</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: '#fff',
              padding: 12,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => {
              setGoogleLoginPressed(true);
              promptAsync();
            }}
          >
            <Image
              source={require('../../assets/images/googlelog.png')}
              style={{ width: 20, height: 20, marginRight: 10 }}
            />
            <Text>Login with Google</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.bottomLink}>
            Don’t have an account? <Text style={styles.signUp}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topHalf: {
    backgroundColor: '#4CAF50',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },

  logo: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
  },
  formContainer: {
    flex: 2,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    backgroundColor: '#f9f9f9',
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 16,
    elevation: 2,
  },
  loginButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  orText: {
    textAlign: 'center',
    color: '#777',
    marginBottom: 12,
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  socialIcon: {
    width: 44,
    height: 44,
    marginHorizontal: 12,
  },
  bottomLink: {
    textAlign: 'center',
    color: '#444',
    marginTop: 10,
    fontSize: 15,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },

  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  googleText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 10,
    fontWeight: '500',
  },

  signUp: {
    fontWeight: 'bold',
    color: '#4CAF50',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
