import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const StatusOverlay = ({
  loading = true,
  success = false,
  loadingMsg = 'Loading...',
  successMsg = 'Success!',
}) => {
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fondo semitransparente
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000, // Asegura que esté encima de otros componentes
  },
  message: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    color: 'white', // Para que el mensaje sea visible sobre el fondo oscuro
  },
});

export default StatusOverlay;
