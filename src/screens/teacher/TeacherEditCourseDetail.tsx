import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { validateFields } from '../../Errors/ValidationsEditCourse'; // Importa la función de validación
import { API_URL } from '@env';

const { width } = Dimensions.get('window');

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
    );
    setErrors(newErrors); 
    if (Object.keys(newErrors).length > 0) {
      return; 
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
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Edit Course</Text>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
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

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f7',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    marginBottom: 20,
    fontSize: 16,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 25,
    alignItems: 'center',
    marginTop: 30,
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
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 20,
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  backButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
