import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { API_URL } from '@env';
import { useAuth } from '../navigation/AuthContext';

const LocationScreen = () => {
  const [country, setCountry] = useState(null);
  const [location] = useState(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, phone } = route.params;
  const [address, setAddress] = useState(null);

  const [permissionRequested, setPermissionRequested] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(null);
  const { token } = useAuth();

  const handleAccept = async () => {
    setPermissionRequested(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setPermissionGranted(true);
      getLocation();
    } else {
      setPermissionGranted(false);
      getLocation();
    }
  };

  const handleCancel = () => {
    navigation.navigate('PinScreen', { userId, phone });
  };

  useEffect(() => {}, []);

  const getAddress = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse`,
        {
          params: {
            lat: latitude,
            lon: longitude,
            format: 'json',
          },
          headers: {
            'User-Agent': 'ClassConnectApp/1.0 (francisco@example.com)',
          },
        },
      );

      const addressData = response.data.address;
      const country = addressData?.country;
      const state = addressData?.state;

      const fullAddress = `${country || 'Unknown'}, ${state || 'Unknown'}`;
      setCountry(country || 'Unknown');
      setAddress(fullAddress);
      updateUserLocation(fullAddress);
      navigation.navigate('PinScreen', { userId, phone });
    } catch (error) {
      console.error('Error getting address:', error);
      alert('Could not fetch location. Please try again later.');
    }
  };

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permiso de ubicación no otorgado');
      return;
    }
    let currentLocation = await Location.getCurrentPositionAsync({});
    getAddress(
      currentLocation.coords.latitude,
      currentLocation.coords.longitude,
    );
  };

  const updateUserLocation = async (country) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/users/profile/${userId}/location`,
        { location: country },
        {
          headers: {},
        },
      );
      if (response.status === 200) {
        console.log('Ubicación actualizada con éxito');
      }
    } catch (error) {
      console.error(
        'Error al actualizar la ubicación:',
        error.response ? error.response.data : error,
      );
    }
  };

  return (
    <View style={styles.container}>
      {!permissionRequested && (
        <>
          <Text style={styles.title}>
            Do you allow access to your location?
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAccept}
            >
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {permissionRequested && permissionGranted && (
        <>
          <Text style={styles.loading}>Getting location...</Text>
          {address && (
            <>
              <Text style={styles.address}>Location: {address}</Text>
              <Button
                title="Continue"
                onPress={() =>
                  navigation.navigate('PinScreen', { userId, phone })
                }
                color="#4CAF50"
              />
            </>
          )}
        </>
      )}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
  },
  address: {
    fontSize: 18,
    color: '#333',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  loading: {
    fontSize: 18,
    color: '#888',
    marginBottom: 20,
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 20,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default LocationScreen;
