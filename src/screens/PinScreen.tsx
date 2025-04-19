import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import { API_URL } from '@env';
const PinScreen = () => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, phone } = route.params;

  const verifyPin = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/api/auth/verify-pin`,
        {
          userId,
          pin,
        },
      );

      if (response.status === 200) {
        navigation.navigate('Login');
      } else {
        Alert.alert('Invalid PIN', 'Please try again.');
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      Alert.alert('Invalid PIN', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendPin = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/resend-pin`,
        {
          userId,
          phone,
        },
      );

      if (response.status === 200) {
        Alert.alert('PIN Sent', 'A new PIN has been sent to your number.');
      }
    } catch (error) {
      console.error('Error resending PIN:', error);
      Alert.alert('Error', 'Could not resend PIN. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter your verification code</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter PIN"
        keyboardType="number-pad"
        value={pin}
        onChangeText={setPin}
        maxLength={6}
      />

      <TouchableOpacity
        style={styles.verifyButton}
        onPress={verifyPin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Verifying...' : 'Verify'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resendButton} onPress={resendPin}>
        <Text style={styles.resendText}>Resend Code</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '80%',
    borderColor: '#CCCCCC',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  resendButton: {
    paddingVertical: 10,
  },
  resendText: {
    color: '#2196F3',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default PinScreen;
