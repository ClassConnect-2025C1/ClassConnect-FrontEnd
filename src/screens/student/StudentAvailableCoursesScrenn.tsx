import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getUserProfileData } from '../../utils/GetUserProfile';
import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AvailableCoursesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, onEnroll } = route.params || {};

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAvailableCourses();
  }, []);

  const fetchAvailableCourses = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const response = await fetch(
          `${API_URL}/api/courses/available/${userId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const text = await response.text();

        try {
          const json = JSON.parse(text);
          if (Array.isArray(json.data)) {
            setCourses(json.data);
          } else {
            console.error('La respuesta no es un array:', json);
            setCourses([]);
          }
        } catch (e) {
          console.error('Respuesta no es JSON válido:', text);
          setCourses([]);
        }
      }
    } catch (error) {
      console.error('Error al obtener los cursos disponibles:', error);
      setError('Error al cargar los cursos.');
    } finally {
      setLoading(false);
    }
  };
  const enrollInCourse = async (courseId) => {
    const user = await getUserProfileData();

    if (!user) {
      alert('Could not get user info.');
      return;
    }
    console.log('user', user);

    try {
      const response = await fetch(
        `${API_URL}/api/courses/${courseId}/enroll/${user.userId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          
          body: JSON.stringify({
            user_id: user.userId,
            email: user.email,
            name: `${user.name} ${user.lastName}`,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Enrollment failed');
      }

      if (onEnroll) onEnroll(); // <-- Llamamos a la función pasada desde StudentCoursesScreen

      navigation.goBack();
    } catch (error) {
      console.error(error);
      alert('Failed to enroll in course.');
    }
  };
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Courses</Text>
      <ScrollView contentContainerStyle={styles.courseList}>
        {courses.map((course) => (
          <View key={course.id} style={styles.courseCard}>
            <Text style={styles.courseText}>{course.title}</Text>
            <TouchableOpacity
              style={styles.enrollButton}
              onPress={() => enrollInCourse(course.id)} // Llamamos a enrollInCourse al hacer clic
            >
              <Text style={styles.enrollButtonText}>Enroll</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AvailableCoursesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'center',
  },
  courseList: {
    paddingBottom: 20,
  },
  courseCard: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseText: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
  enrollButton: {
    borderColor: '#BDBDBD',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#E0E0E0',
  },
  enrollButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
  },

  doneButton: {
    backgroundColor: '#aaa',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
