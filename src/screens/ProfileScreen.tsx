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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { AcceptOnlyModal, AcceptRejectModal } from '../components/Modals';
import { API_URL } from '@env';

const ProfileScreen = () => {
  const navigation = useNavigation();

  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState(null);
  const [role, setRole] = useState(null);
  const [bio, setBio] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userImage, setUserImage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const decoded = jwtDecode(token);
          const userId = decoded.user_id || decoded.sub;

          const response = await fetch(
            `${API_URL}/api/users/profile/${userId}`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          const userProfile = await response.json();

          if (userProfile) {
            setFirstName(userProfile.name || 'No Name');
            setLastName(userProfile.last_name || 'No Last Name');
            setEmail(userProfile.email || 'No Email');
            setBio(userProfile.bio || '');
            setUserImage(userProfile.photo || userProfile.photo_url || null);
            setLocation(userProfile.location || null);
            setRole(userProfile.role || null);
            setPhoneNumber(userProfile.phone || '+543329602476');
          } else {
            setFirstName('No Name');
            setLastName('No Last Name');
            setEmail('No Email');
            setBio('');
            setUserImage(null);
            setLocation('');
            setRole(null);
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

  const handleSelectImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.5,
    });

    if (!result.didCancel && result.assets) {
      setUserImage(result.assets[0].uri);
    }
  };

  const handleSaveChanges = async () => {
    if (isLoading) return;

    if (
      !firstName ||
      !lastName ||
      firstName.length < 2 ||
      lastName.length < 2 ||
      !phoneNumber
    ) {
      setModalMessage(
        'The only field that can be empty is the bio. Please fill all fields.',
      );
      setShowModal(true);
      return;
    }

    if (!phoneNumber.startsWith('+54')) {
      setModalMessage('The number must start with +54');
      setShowModal(true);
      return;
    }

    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        const userId = decoded.user_id || decoded.sub;

        const response = await fetch(`${API_URL}/api/users/profile/${userId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: firstName,
            last_name: lastName,
            email: email,
            bio: bio,
            photo: userImage,
            phone: phoneNumber,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          console.log('Perfil actualizado con éxito');
          setModalMessage('Profile updated successfully');
          setShowModal(true);
        } else {
          console.error('Error al actualizar el perfil:', result);
          setModalMessage('Error updating profile');
          setShowModal(true);
        }
      }
    } catch (error) {
      console.error('Error al guardar los cambios:', error);
      setModalMessage('Error saving changes');
      setShowModal(true);
    } finally {
      setIsLoading(false);
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

      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        <Text style={styles.title}>My Profile</Text>

        <TouchableOpacity onPress={handleSelectImage}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri:
                  userImage || 'https://www.w3schools.com/howto/img_avatar.png',
              }}
              style={styles.profileImage}
            />
            <Text style={styles.changeText}>Change profile picture</Text>
          </View>
        </TouchableOpacity>

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
          style={[styles.input, styles.readOnlyInput]}
          value={email}
          editable={false}
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={[styles.input, styles.readOnlyInput]}
          value={location}
          editable={false}
        />

        <Text style={styles.label}>Role</Text>
        <TextInput
          style={[styles.input, styles.readOnlyInput]}
          value={role}
          editable={false}
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bio]}
          value={bio}
          onChangeText={setBio}
          multiline
        />

        <Text style={styles.label}>Phone number</Text>
        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
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
  logoutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    alignSelf: 'flex-end',
    marginRight: 20,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    fontSize: 12,
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

  imageButton: {
    marginTop: 10,
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },

  readOnlyInput: {
    backgroundColor: '#f0f0f0',
  },
});

export default ProfileScreen;
