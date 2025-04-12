import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';

const LocationScreen = () => {
  const [country, setCountry] = useState(null);
  const [location] = useState(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params;
  const [address, setAddress] = useState(null);

  useEffect(() => {
    getLocation();
  }, []);

  const getAddress = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
      );
      const country = response.data.address?.country;
      setCountry(country || 'Desconocido');
      setAddress(country || 'Desconocido');
      updateUserLocation(country || 'Desconocido');
    } catch (error) {
      console.error('Error al obtener la dirección:', error);
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
        `http://localhost:8000/users/profile/${userId}/location`,
        { location_data: country },
      );
      if (response.status === 200) {
        console.log('Ubicación actualizada con éxito');
        navigation.navigate('Profile');
      }
    } catch (error) {
      console.error('Error al actualizar la ubicación:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Get location</Text>
      {address ? (
        <Text style={styles.address}>Country: {address}</Text>
      ) : (
        <Text style={styles.loading}>Get location...</Text>
      )}
      <Button
        title="Continuar"
        onPress={() => navigation.navigate('Login')}
        color="#4CAF50"
      />
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
});

export default LocationScreen;
