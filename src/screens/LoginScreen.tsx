import React, { useState } from 'react';
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
import GoogleLogin from '../components/GoogleAuth';
import * as AuthSession from 'expo-auth-session';
import { AcceptOnlyModal, AcceptRejectModal } from '../components/Modals';
import { API_URL } from '@env';

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

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');
    let valid = true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Email is invalid');
      valid = false;
    }

    if (password < 4) {
      setPasswordError('password is not correct');
      valid = false;
    }

    if (!valid) return;

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('token', data.access_token);
        const decodedToken: any = jwtDecode(data.access_token);
        const user_id = decodedToken.sub;

        try {
          const profileResponse = await fetch(
            `${API_URL}/api/users/profile/${user_id}`,
            {
              method: 'GET',
              headers: {},
            },
          );

          if (!profileResponse.ok) {
            showLoginErrorToast();
            return;
          }

          const userProfile = await profileResponse.json();
          const userRole = userProfile.role;

          if (userRole === 'teacher') {
            navigation.navigate('TeacherCourses');
          } else {
            navigation.navigate('StudentCourses');
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

        <Text style={styles.orText}>Or log in with</Text>

        <View style={styles.socialContainer}>
          <GoogleLogin />
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

  signUp: {
    fontWeight: 'bold',
    color: '#4CAF50',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
