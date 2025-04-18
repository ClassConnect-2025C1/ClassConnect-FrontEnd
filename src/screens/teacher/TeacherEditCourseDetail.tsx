import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function EditCourseScreen({ route }) {
  const { course } = route.params;

  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [eligibilityCriteria, setEligibilityCriteria] = useState(
    course.eligibilityCriteria || '',
  );
  const [startDate, setStartDate] = useState(course.startDate);
  const [endDate, setEndDate] = useState(course.endDate);

  const [errors, setErrors] = useState({
    title: '',
    description: '',
    eligibilityCriteria: '',
    startDate: '',
    endDate: '',
  });

  const navigation = useNavigation();

  // Validate date format YYYY-MM-DD
  const isValidDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateString.match(regex)) return false;
    const date = new Date(dateString);
    return date.toISOString().slice(0, 10) === dateString;
  };

  const validateFields = () => {
    const newErrors = {};

    if (title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (description.length < 3) {
      newErrors.description = 'Description must be at least 3 characters';
    }

    if (eligibilityCriteria.length < 3) {
      newErrors.eligibilityCriteria =
        'Eligibility criteria must be at least 3 characters';
    }

    if (!isValidDate(startDate)) {
      newErrors.startDate = 'Start date must be valid (YYYY-MM-DD)';
    }

    if (!isValidDate(endDate)) {
      newErrors.endDate = 'End date must be valid (YYYY-MM-DD)';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async () => {
    if (!validateFields()) {
      return; // Do not continue if there are errors
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const formattedStartDate = `${startDate}T00:00:00Z`;
      const formattedEndDate = `${endDate}T00:00:00Z`;

      const response = await fetch(
        `http://0.0.0.0:7999/api/courses/${course.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            description,
            eligibility_criteria: eligibilityCriteria,
            start_date: formattedStartDate,
            end_date: formattedEndDate,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error updating course:', errorData);
        return;
      }

      const updatedCourse = await response.json();
      navigation.navigate('TeacherCourses', { updatedCourse });
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />
      {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />
      {errors.description && (
        <Text style={styles.errorText}>{errors.description}</Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="Eligibility Criteria"
        value={eligibilityCriteria}
        onChangeText={setEligibilityCriteria}
      />
      {errors.eligibilityCriteria && (
        <Text style={styles.errorText}>{errors.eligibilityCriteria}</Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="Start Date (YYYY-MM-DD)"
        value={startDate}
        onChangeText={setStartDate}
      />
      {errors.startDate && (
        <Text style={styles.errorText}>{errors.startDate}</Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="End Date (YYYY-MM-DD)"
        value={endDate}
        onChangeText={setEndDate}
      />
      {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleSaveChanges}>
        <Text style={styles.buttonText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f4f4f4',
    flexGrow: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  backButton: {
    backgroundColor: '#D3D3D3',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    alignItems: 'center',
    marginLeft: 20,
    marginTop: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#707070',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
