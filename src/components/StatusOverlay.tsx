import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const StatusOverlay = ({ loading = true, success = false, loadingMsg = 'Loading...', successMsg = 'Success!' }) => {
  return (
    <View style={styles.container}>
      {success ? (
        <>
          <Ionicons name="checkmark-circle-outline" size={48} color="green" />
          <Text style={styles.message}>{successMsg}</Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#333" />
          <Text style={styles.message}>{loadingMsg}</Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default StatusOverlay;
