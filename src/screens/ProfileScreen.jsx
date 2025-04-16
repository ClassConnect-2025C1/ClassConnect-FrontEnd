import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { useNavigation } from '@react-navigation/native';

const ProfileScreen = () => {
  const navigation = useNavigation();

  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [userImage, setUserImage] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const decoded = jwtDecode(token);
          const userId = decoded.user_id || decoded.sub;

          const response = await fetch(
            `http://0.0.0.0:7999/api/users/profile/${userId}`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          const userProfile = await response.json();

          if (userProfile) {
            console.log('json', userProfile.name);
            setFirstName(userProfile.name || 'No Name');
            setLastName(userProfile.last_name || 'No Last Name');
            setEmail(userProfile.email || 'No Email');
            setBio(userProfile.bio || '');
            setUserImage(userProfile.image || null);
          } else {
            setFirstName('No Name');
            setLastName('No Last Name');
            setEmail('No Email');
            setBio('');
            setUserImage(null);
          }
        }
      } catch (error) {
        console.error('Error al obtener el perfil del usuario:', error);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleSaveChanges = async () => {
    if (isLoading) return;

    if (!firstName || !lastName || !email) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);

      const token = await AsyncStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        const userId = decoded.user_id || decoded.sub;

        const response = await fetch(
          `http://0.0.0.0:7999/api/users/profile/${userId}`,
          {
            method: 'PATCH',
            headers: {},
            body: JSON.stringify({
              name: firstName,
              last_name: lastName,
              email: email,
            }),
          },
        );

        const result = await response.json();

        if (response.ok) {
          console.log('Perfil actualizado con éxito');
          alert('Success', 'Profile updated successfully!');
          navigation.goBack();
        } else {
          console.error('Error al actualizar el perfil:', result);
          alert('Hubo un error al actualizar el perfil');
        }
      }
    } catch (error) {
      console.error('Error al guardar los cambios:', error);
      alert('Hubo un error al guardar los cambios');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>My Profile</Text>

      <View style={styles.imageContainer}>
        {userImage ? (
          <Image source={{ uri: userImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text>No Image</Text>
          </View>
        )}
        <Text style={styles.changeText}>Change profile picture</Text>
      </View>

      <Text style={styles.label}>First Name</Text>
      <TextInput
        style={styles.input}
        value={firstName}
        onChangeText={setFirstName}
      />

      <Text style={styles.label}>Last Name</Text>
      <TextInput
        style={styles.input}
        value={lastName}
        onChangeText={setLastName}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, styles.bio]}
        value={bio}
        onChangeText={setBio}
        multiline
      />

      <TouchableOpacity
        style={styles.saveButton}
        onPress={() => handleSaveChanges()}
      >
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 40,
    backgroundColor: '#fff',
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    alignSelf: 'flex-end',
    marginRight: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
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
  placeholderImage: {
    width: 120,
    height: 120,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
  },
  changeText: {
    marginTop: 8,
    color: 'gray',
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
  bio: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#d0d0d0',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  backButtonText: {
    color: 'white',
    fontSize: 15,
  },
  backButton: {
    position: 'absolute',
    top: 43,
    left: 16,
    backgroundColor: '#d0d0d0',
    padding: 5,
    borderRadius: 10,
  },
});

export default ProfileScreen;
