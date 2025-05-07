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
  const [approvedCourses, setApprovedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCoursesAndApprovals();
  }, []);

  const fetchCoursesAndApprovals = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {

        const coursesRes = await fetch(
          `${API_URL}/api/courses/available/${userId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const coursesText = await coursesRes.text();
        let availableCourses = [];
        try {
          const json = JSON.parse(coursesText);
          if (Array.isArray(json.data)) {
            availableCourses = json.data;
          } else {
            console.error('La respuesta de cursos no es un array:', json);
          }
        } catch (e) {
          console.error('Cursos no es JSON válido:', coursesText);
        }

        const approvedRes = await fetch(`http://192.168.100.208:8002/approved/${userId}`);
        const approvedJson = await approvedRes.json();
        console.log("approvedJson", approvedJson);
        
        const approvedCourseNames = approvedJson.data?.map((course) => course.name) || [];

        setCourses(availableCourses);
        setApprovedCourses(approvedCourseNames);
      }
    } catch (error) {
      console.error('Error al obtener datos:', error);
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

      if (onEnroll) onEnroll();
      navigation.goBack();
    } catch (error) {
      console.error(error);
      alert('Failed to enroll in course.');
    }
  };

  const isEligible = (course) => {
    console.log("course.eligibility_criteria", course);

    if (!course.eligibilityCriteria || course.eligibilityCriteria.length === 0) {
      return true;
    }
    return course.eligibilityCriteria.every((reqName) => approvedCourses.includes(reqName));
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
            {isEligible(course) ? (
              <TouchableOpacity
                style={styles.enrollButton}
                onPress={() => enrollInCourse(course.id)}
              >
                <Text style={styles.enrollButtonText}>Enroll</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.enrollButton, { backgroundColor: '#ccc' }]}
                onPress={() => alert('Not eligible. See details coming soon.')}
              >
                <Text style={styles.enrollButtonText}>See Details</Text>
              </TouchableOpacity>
            )}
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
