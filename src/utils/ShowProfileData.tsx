import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getUserProfileData } from '../utils/GetUserProfile';

const ViewProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, token} = route.params || {}; // Recuperar userId desde los parámetros de navegación

  const [profile, setProfile] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    photo: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await getUserProfileData(token ,userId); // Pasar userId si se proporciona
      if (data) {
        setProfile({
          name: data.name || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '+5491165101272',
          photo: data.photo || '',
        });
      }
    };

    fetchProfile();
  }, [userId]); // Asegurarse de que el efecto se ejecute nuevamente si el userId cambia

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                profile.photo ||
                'https://www.w3schools.com/howto/img_avatar.png',
            }}
            style={styles.profileImage}
          />
        </View>

        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={[styles.input, styles.readOnlyInput]}
          value={profile.name}
          editable={false}
        />

        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={[styles.input, styles.readOnlyInput]}
          value={profile.lastName}
          editable={false}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, styles.readOnlyInput]}
          value={profile.email}
          editable={false}
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={[styles.input, styles.readOnlyInput]}
          value={profile.phone}
          editable={false}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 40,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 43,
    left: 16,
    backgroundColor: '#d0d0d0',
    padding: 5,
    borderRadius: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 15,
  },
  title: {
    alignSelf: 'center',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
  },
  label: {
    fontSize: 14,
    marginTop: 10,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 10,
  },
  readOnlyInput: {
    backgroundColor: '#f0f0f0',
  },
});

export default ViewProfileScreen;
