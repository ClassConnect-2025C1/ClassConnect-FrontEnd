import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getUserProfileData } from '../../utils/GetUserProfile';
import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../navigation/AuthContext';
import { AcceptOnlyModal } from '@/components/Modals';
import StatusOverlay from '../../components/StatusOverlay';

const AvailableCoursesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, onEnroll } = route.params || {};
  const { token } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [saveChangueConfirmed, setChangueConfirmed] = useState(false);

  const [courses, setCourses] = useState([]);
  const [approvedCourses, setApprovedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseSearchText, setCourseSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(courseSearchText.toLowerCase()) ||
      course.createdBy.toLowerCase().includes(courseSearchText.toLowerCase()) ||
      course.startDate.toLowerCase().includes(courseSearchText.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);

  useEffect(() => {
    fetchCoursesAndApprovals();
  }, []);

  const fetchCoursesAndApprovals = async () => {
    try {
      if (token) {
        const coursesRes = await fetch(`${API_URL}/api/courses/available/`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
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

        const approvedRes = await fetch(`${API_URL}/api/courses/approved`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const approvedJson = await approvedRes.json();

        console.log(approvedJson);
        setCourses(availableCourses);
        setApprovedCourses(approvedJson.data || []);
      }
    } catch (error) {
      console.error('Error al obtener datos:', error);
      setError('Error al cargar los cursos.');
    } finally {
      setLoading(false);
    }
  };

  const enrollInCourse = async (courseId) => {
    const user = await getUserProfileData(token);

    if (!user) {
      alert('Could not get user info.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/courses/${courseId}/enroll`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: user.userId,
            email: user.email,
            name: `${user.name} ${user.lastName}`,
          }),
        },
      );

      if (!response.ok) {
        if (response.status === 409) {
          setIsLoading(false);
          setShowModal(true);
          return;
        } else {
          const errorText = await response.text();
          console.error('Error:', errorText);
          alert('Enrollment failed');
          return;
        }
      }

      setIsLoading(true);

      if (onEnroll) onEnroll();

      setTimeout(() => {
        setChangueConfirmed(true);

        setTimeout(() => {
          setIsLoading(false);
          setChangueConfirmed(false);
          navigation.goBack();
        }, 2000);
      }, 2000);
    } catch (error) {
      console.error(error);
    }
  };

  const isEligible = (course) => {
    if (
      !course.eligibilityCriteria ||
      course.eligibilityCriteria.length === 0
    ) {
      return true;
    }
    console.log(course.eligibilityCriteria);
    console.log(approvedCourses);

    return course.eligibilityCriteria.every((reqName) =>
      approvedCourses.includes(reqName),
    );
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

  return isLoading ? (
    <StatusOverlay
      loading={!saveChangueConfirmed}
      success={saveChangueConfirmed}
      loadingMsg="Enrrolling ..."
      successMsg="Enrrolled successfully!"
    />
  ) : (
    <View style={styles.container}>
      <Text style={styles.title}>Available Courses</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search Course"
          placeholderTextColor="#aaa"
          value={courseSearchText}
          onChangeText={setCourseSearchText}
        />
      </View>

      <AcceptOnlyModal
        visible={showModal}
        message="Yo already enrolled in this course!"
        onAccept={() => setShowModal(false)}
        onClose={() => setShowModal(false)}
      />

      <ScrollView contentContainerStyle={styles.courseList}>
        {filteredCourses
          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
          .map((course) => (
            <View key={course.id} style={styles.courseCard}>
              <Text style={styles.courseText}>{course.title}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {isEligible(course) && (
                  <TouchableOpacity
                    style={styles.enrollButton}
                    onPress={() => enrollInCourse(course.id)}
                  >
                    <Text style={styles.enrollButtonText}>Enroll</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.enrollButton, { backgroundColor: '#4CAF50' }]}
                  onPress={() =>
                    navigation.navigate('ShowCourseData', { course })
                  }
                >
                  <Text style={[styles.enrollButtonText, { color: '#fff' }]}>
                    Details
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
      </ScrollView>

      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[
            styles.pageButton,
            currentPage === 1 && { backgroundColor: '#ccc' },
          ]}
          onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <Text style={styles.pageButtonText}>{'← Prev'}</Text>
        </TouchableOpacity>

        <Text style={styles.pageNumber}>
          Page {currentPage} of {totalPages}
        </Text>

        <TouchableOpacity
          style={[
            styles.pageButton,
            currentPage === totalPages && { backgroundColor: '#ccc' },
          ]}
          onPress={() =>
            currentPage < totalPages && setCurrentPage(currentPage + 1)
          }
          disabled={currentPage === totalPages}
        >
          <Text style={styles.pageButtonText}>{'Next →'}</Text>
        </TouchableOpacity>
      </View>

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
    marginHorizontal: 8, // 👈 achica el ancho del card
    flexDirection: 'column', // 👈 cambiamos a columna
    alignItems: 'flex-start',
    gap: 12,
  },
  courseText: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },

  courseActions: {
    flexDirection: 'row',
    flexWrap: 'wrap', // 👈 permite que se acomoden mejor
    gap: 8,
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    gap: 12,
  },
  pageButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#007bff',
    borderRadius: 6,
  },
  pageButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  pageNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
