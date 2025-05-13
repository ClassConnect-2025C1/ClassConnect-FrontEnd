import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AcceptOnlyModal } from '../../components/Modals';
import { API_URL } from '@env';

const VerifyPinScreen = () => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params;

  const verifyPin = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/api/auth/recovery-password/verify-pin`,
        { pin, userEmail: email },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status === 200) {
        setModalMessage('PIN verified successfully.');
        setShowModal(true);
        setTimeout(() => {
          navigation.navigate('ResetPassword', { email });
        }, 1500);
      } else {
        setModalMessage('Invalid PIN, please try again.');
        setShowModal(true);
      }
    } catch (error) {
      console.error(
        'Error verifying PIN:',
        error.response?.data || error.message,
      );
      setModalMessage('Invalid PIN, please resend the PIN again.');
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const resendPin = async () => {
    try {
      setLoading(true);
      console.log('🌐 Request body for resending PIN:', { userEmail: email });

      const response = await axios.post(
        `${API_URL}/api/auth/recovery-password`,
        { userEmail: email },
        { headers: { 'Content-Type': 'application/json' } },
      );

      if (response.status === 200) {
        setModalMessage('PIN resent successfully.');
        setShowModal(true);
      } else {
        setModalMessage('Could not resend PIN. Please try again.');
        setShowModal(true);
      }
    } catch (error) {
      console.error(
        'Error resending PIN:',
        error.response?.data || error.message,
      );
      setModalMessage('Could not resend PIN. Please try again.');
      setShowModal(true);
    } finally {
      setLoading(false);
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

      <TouchableOpacity
        style={styles.resendButton}
        onPress={resendPin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Resending...' : 'Resend PIN'}
        </Text>
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
    backgroundColor: '#FFC107',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default VerifyPinScreen;
