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
import { validateFields } from '../../Errors/ValidationsEditCourse'; // Importa la función de validación
import { API_URL } from '@env';
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

  const handleSaveChanges = async () => {
    const newErrors = validateFields(
      title,
      description,
      eligibilityCriteria,
      startDate,
      endDate,
    ); // Llamada a la función de validación
    setErrors(newErrors); // Actualiza los errores

    if (Object.keys(newErrors).length > 0) {
      return; // Si hay errores, no continuar
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const formattedStartDate = `${startDate}T00:00:00Z`;
      const formattedEndDate = `${endDate}T00:00:00Z`;

      const response = await fetch(`${API_URL}/api/courses/${course.id}`, {
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
      });

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
    backgroundColor: '#FFFFFF', // Fondo blanco
    flexGrow: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    backgroundColor: '#F9F9F9',
    fontSize: 16,
  },
  backButton: {
    backgroundColor: '#E0E0E0', // Gris claro
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#4CAF50', // Verde llamativo
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 25,
    marginTop: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
