import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const TeacherCreateNewCourseScreen = () => {
  const navigation = useNavigation();

  const [courseName, setCourseName] = useState('');
  const [description, setDescription] = useState('');
  const [eligibilityCriteria, setEligibilityCriteria] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Course</Text>

      <Text style={styles.label}>Course Name</Text>
      <TextInput
        style={styles.input}
        value={courseName}
        onChangeText={setCourseName}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.description]}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>Eligibility Criteria</Text>
      <TextInput
        style={styles.input}
        value={eligibilityCriteria}
        onChangeText={setEligibilityCriteria}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.createButton}>
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
    backgroundColor: '#a0a0a0', // Gris más oscuro
    padding: 14,
    borderRadius: 10,
    flex: 0.48,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#d0d0d0', // Gris más claro
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
