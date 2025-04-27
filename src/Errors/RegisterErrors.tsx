import React from 'react';
import { Text, StyleSheet } from 'react-native';

const RegisterError = ({ message }) => {
  if (!message) return null;

  return <Text style={styles.errorText}>{message}</Text>;
};

const styles = StyleSheet.create({
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 5,
  },
});

export default RegisterError;
