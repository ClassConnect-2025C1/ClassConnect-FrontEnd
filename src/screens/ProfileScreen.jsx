import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = () => {
  const navigation = useNavigation();

  const [firstName, setFirstName] = useState('Claude');
  const [lastName, setLastName] = useState('Redrum');
  const [email, setEmail] = useState('claudekoo@example.com');
  const [bio, setBio] = useState(
    'IT Engineering student at Michigan University.',
  );


      const handleLogout = async () => {
        try {
          await AsyncStorage.removeItem('token');
          navigation.navigate('Login');
        } catch (error) {
          console.error('Error al cerrar sesión:', error);
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
        <View style={styles.placeholderImage} />

        {/* In the future this text is necesary to search and change de picture */}
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
      {/* For the momment this buttom only go back */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 40,
    backgroundColor: '#fff',
  },

    logoutButton: {
      padding: 10,
         alignItems: 'center',
    },
    logoutButtonText: {
      fontSize: 16,
      color: 'red',
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
