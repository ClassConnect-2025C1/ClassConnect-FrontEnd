import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { AcceptOnlyModal } from '../../components/Modals';

const TeacherCreateNewCourseScreen = () => {
  const navigation = useNavigation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eligibilityCriteria, setEligibilityCriteria] = useState('');
  const [capacity, setCapacity] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const handleCreateCourse = async () => {
    if (!title || !description || !eligibilityCriteria || !capacity) {
      setModalMessage('All fields must be filled.');
      setShowModal(true);
      return;
    }
    const capacityNumber = parseInt(capacity, 10);
    if (isNaN(capacityNumber) || capacityNumber <= 0) {
      setModalMessage('Capacity must be a valid number greater than zero.');
      setShowModal(true);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch('http://0.0.0.0:7999/api/courses/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          eligibility_criteria: eligibilityCriteria,
          capacity: parseInt(capacity),
          created_by: 'teacher',
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error creating course:', errorData);
        setModalMessage('Failed to create course. Please try again.');
        setShowModal(true);
        return;
      }

      const data = await response.json();
      console.log('Curso creado exitosamente:', data);

      navigation.navigate('TeacherCourses', { newCourse: data });
    } catch (error) {
      setModalMessage('An unexpected error occurred.');
      setShowModal(true);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Course</Text>

      <Text style={styles.label}>Course Name</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.description]}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <AcceptOnlyModal
        visible={showModal}
        message={modalMessage}
        onAccept={() => setShowModal(false)}
      />

      <Text style={styles.label}>Eligibility Criteria</Text>
      <TextInput
        style={styles.input}
        value={eligibilityCriteria}
        onChangeText={setEligibilityCriteria}
      />

      <Text style={styles.label}>Capacity</Text>
      <TextInput
        style={styles.input}
        value={capacity}
        onChangeText={setCapacity}
        keyboardType="numeric"
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateCourse}
        >
          <Text style={styles.buttonText}>Create</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 40,
    backgroundColor: '#fff',
  },
  title: {
    alignSelf: 'center',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
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
  description: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  createButton: {
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 10,
    flex: 0.48,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#555',
    padding: 14,
    borderRadius: 10,
    flex: 0.48,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
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
});

export default TeacherCreateNewCourseScreen;
