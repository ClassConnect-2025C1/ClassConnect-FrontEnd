import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EditCourseScreen({ route, navigation }) {
  const { course } = route.params;

  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [eligibilityCriteria, setEligibilityCriteria] = useState(
    course.eligibilityCriteria || '',
  );
  const [startDate, setStartDate] = useState(course.startDate);
  const [endDate, setEndDate] = useState(course.endDate);

  const handleSaveChanges = async () => {
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
        console.error('Error al actualizar curso:', errorData);
        Alert.alert('Error', 'No se pudo actualizar el curso.');
        return;
      }

      const updatedCourse = await response.json();
      Alert.alert('Éxito', 'Curso actualizado correctamente.');

      navigation.navigate('TeacherCourses', { updatedCourse });
    } catch (error) {
      console.error('Error de red:', error);
      Alert.alert('Error', 'Ocurrió un error al conectar con el servidor.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Título"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Descripción"
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Criterios de elegibilidad"
        value={eligibilityCriteria}
        onChangeText={setEligibilityCriteria}
      />
      <TextInput
        style={styles.input}
        placeholder="Fecha de inicio (YYYY-MM-DD)"
        value={startDate}
        onChangeText={setStartDate}
      />
      <TextInput
        style={styles.input}
        placeholder="Fecha de fin (YYYY-MM-DD)"
        value={endDate}
        onChangeText={setEndDate}
      />

      <Button title="Guardar cambios" onPress={handleSaveChanges} />
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
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
});
