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
import { jwtDecode } from 'jwt-decode';
import { Alert } from 'react-native';
import RegisterErrors from '../Errors/RegisterErrors';

const RegisterScreen = () => {
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState(null);

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const handleRegister = async () => {
    const newErrors = {};

    // si el nombre tiene menos de 3 letras tiro error
    if (firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    // si el apellido tiene menos de 3 letras tiro eero
    if (lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }
    // si el mail no formato email tiero error
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    // si la contraseña no tiene al menos 4 caracteres tiero error
    if (password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      console.log('Please fill in all fields');
      return;
    }

    setErrors({});

    try {
      const response = await fetch('http://192.168.0.14:8000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: firstName,
          last_name: lastName,
          email,
          password,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        const token = data.access_token;

        const decoded = jwtDecode(token);
        const userId = decoded.sub;

        console.log('Registration successful:', data);
        navigation.navigate('Location', { userId });
      } else {
        Alert.alert(
          'Registration failed',
          data.detail || 'Something went wrong, please try again.',
        );
      }
    } catch (error) {
      console.error('Error during registration: de json is ', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHalf}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>Create an Account</Text>
            <Text style={styles.subtitle}>Let’s get you started</Text>

            <TextInput
              placeholder="First name"
              style={styles.input}
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                if (text.trim() === '') {
                  setErrors((prev) => ({
                    ...prev,
                    firstName: 'First name must be at least 2 characters',
                  }));
                } else {
                  setErrors((prev) => ({ ...prev, firstName: '' }));
                }
              }}
            />
            {errors.firstName && (
              <Text style={styles.errorText}>{errors.firstName}</Text>
            )}

            <TextInput
              placeholder="Last name"
              style={styles.input}
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                if (text.trim() === '') {
                  setErrors((prev) => ({
                    ...prev,
                    lastName: 'Last name must be at least 2 characters',
                  }));
                } else {
                  setErrors((prev) => ({ ...prev, lastName: '' }));
                }
              }}
            />
            {errors.lastName && (
              <Text style={styles.errorText}>{errors.lastName}</Text>
            )}

            <TextInput
              placeholder="Create your password"
              style={styles.input}
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (text.trim() === '') {
                  setErrors((prev) => ({
                    ...prev,
                    password: 'Password must be at least 4 characters',
                  }));
                } else {
                  setErrors((prev) => ({ ...prev, password: '' }));
                }
              }}
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            <TextInput
              placeholder="Email"
              style={styles.input}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (text.trim() === '') {
                  setErrors((prev) => ({ ...prev, email: 'Email is invalid' }));
                } else {
                  setErrors((prev) => ({ ...prev, email: '' }));
                }
              }}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}

            <TouchableOpacity
              style={styles.registerButton}
              onPress={async () => {
                await handleRegister();
              }}
            >
              <Text style={styles.registerButtonText}>Sign up</Text>
            </TouchableOpacity>

            <Text style={styles.orText}>Or sign up with</Text>

            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.googleButton}>
                <Image
                  source={require('../../assets/images/googlelog.png')}
                  style={styles.socialIcon}
                />
                <Text style={styles.googleText}>Google</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.bottomLink}>
                Do you have an account?{' '}
                <Text style={styles.signIn}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 2,
  },
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
  logo: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  formContainer: {
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
  registerButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 16,
    elevation: 2,
  },
  registerButtonText: {
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
  signIn: {
    fontWeight: 'bold',
    color: '#4CAF50',
    textDecorationLine: 'underline',
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

  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
  },
});

export default RegisterScreen;
