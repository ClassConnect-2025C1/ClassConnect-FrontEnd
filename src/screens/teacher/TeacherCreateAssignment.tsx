import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AcceptOnlyModal } from '../../components/Modals';
import { API_URL } from '@env';

const TeacherCreateAssignments = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { course } = route.params; 

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');


  const handleCreateAssignment = async () => {
    if (!title || !description || !dueDate) {
      setModalMessage('All fields must be filled.');
      setShowModal(true);
      return;
    }
    

  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(dueDate);
  if (!isValidDate) {
    setModalMessage('Invalid date format. Use YYYY-MM-DD.');
    setShowModal(true);
    return;
  }

  const parsedDate = new Date(`${dueDate}T23:59:59Z`);
  if (isNaN(parsedDate.getTime())) {
    setModalMessage('Invalid date. Please check the value.');
    setShowModal(true);
    return;
  }

  const isoDueDate = parsedDate.toISOString();

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(`http://192.168.100.208:8002/${course.id}/assignment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          deadline: isoDueDate,
          course_id:  Number(course.id),
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error creating assignment:', errorData);
        setModalMessage('Failed to create assignment. Please try again.');
        setShowModal(true);
        return;
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error:', error);
      setModalMessage('An error occurred. Please try again.');
      setShowModal(true);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Assignment</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Assignment Title"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Assignment Description"
      />

      <Text style={styles.label}>Due Date</Text>
      <TextInput
        style={styles.input}
        value={dueDate}
        onChangeText={setDueDate}
        placeholder="Due Date (YYYY-MM-DD)"
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateAssignment}
        >
          <Text style={styles.buttonText}>Create</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

         <AcceptOnlyModal
              visible={showModal}
              message={modalMessage}
              onAccept={() => setShowModal(false)}
              onClose={() => setShowModal(false)}
            />
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
});

export default TeacherCreateAssignments;
