import { useNavigation } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { AcceptRejectModal } from '../../components/Modals';
import { getUserProfileData } from '../../utils/GetUserProfile';
import {
  Modal,
  Button,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { API_URL } from '@env';
import { useAuth } from '../../navigation/AuthContext';

const CoursesScreen = ({ route }) => {
  const navigation = useNavigation();

  const cardColors = [
    '#6C5CE7',
    '#00B894',
    '#0984E3',
    '#E17055',
    '#FD79A8',
    '#FDCB6E',
    '#74B9FF',
    '#55EFC4',
    '#FAB1A0',
  ];

  const [courses, setCourses] = useState<Course[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const { token } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchText.toLowerCase()) ||
    course.createdBy.toLowerCase().includes(searchText.toLowerCase()) ||
    course.startDate.toLowerCase().includes(searchText.toLowerCase()),

  );
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);

  useEffect(() => {
    const fetchUserCourses = async () => {
      try {
        const userProfile = await getUserProfileData(token);
        const teacherEmail = userProfile?.email;

        if (token && teacherEmail) {
          const response = await fetch(`${API_URL}/api/courses/`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const text = await response.text();

          try {
            const json = JSON.parse(text);

            if (Array.isArray(json.data)) {
              const filteredCourses = json.data.filter(
                (course) => course.createdBy === teacherEmail,
              );
              setCourses(filteredCourses);
            } else {
              console.log('La respuesta no es un array:', json);
              setCourses([]);
            }
          } catch (e) {
            console.log('Respuesta no es JSON válido:', text);
            setCourses([]);
          }
        }
      } catch (error) {
        console.log('Error al obtener los cursos del usuario:', error);
      }
    };

    fetchUserCourses();
  }, []);

  const confirmDelete = (courseId: string) => {
    setCourseToDelete(courseId);
    setShowDeleteModal(true);
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete the course.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          const text = await response.text();
          console.error('Non-JSON error response:', text);
        }
        console.error('Delete course error:', errorMessage);
        return;
      }

      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (err) {
      console.error('Unexpected error while deleting course:', err);
    }
  };

  useEffect(() => {
    if (route.params?.newCourse) {
      setCourses((prevCourses) => [...prevCourses, route.params.newCourse]);
    }
  }, [route.params?.newCourse]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../../assets/images/logo.png')}
          style={styles.icon}
        />
        <Text style={styles.headerTitle}>ClassConnect</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Image
            source={require('../../../assets/images/profile/profile-icon.jpg')}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search"
          placeholderTextColor="#aaa"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <ScrollView contentContainerStyle={styles.courseList}>
        {filteredCourses
          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
          .map((course, index) => (
            <View
              key={course.id}
              style={[
                styles.courseCard,
                { backgroundColor: cardColors[index % cardColors.length] },
              ]}
            >
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('TeacherCourseDetail', { course })
                }
                style={{ flex: 1 }}
              >
                <Text style={styles.courseText}>{course.title}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => confirmDelete(course.id)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
      </ScrollView>

      {/* Controles de paginación */}
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
        style={{
          backgroundColor: '#aaa',
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 20,
          alignSelf: 'center',
          marginBottom: 10,
        }}
        onPress={() => navigation.navigate('CreateNewCourse')}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          Create new course
        </Text>
      </TouchableOpacity>

      <View
        style={{
          height: 1,
          backgroundColor: '#ccc',
          opacity: 0.5,
          marginHorizontal: 20,
          marginBottom: 5,
        }}
      />

      <AcceptRejectModal
        visible={showDeleteModal}
        message="Are you sure you want to delete this course?"
        onAccept={() => {
          if (courseToDelete) {
            handleDeleteCourse(courseToDelete);
          }
          setShowDeleteModal(false);
          setCourseToDelete(null);
        }}
        onReject={() => setShowDeleteModal(false)}
        onClose={() => setShowDeleteModal(false)}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 16,
  },

  courseList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  courseCard: {
    height: 80,
    borderRadius: 10,
    justifyContent: 'center',
    paddingLeft: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  courseText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  iconContainer: {
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  deleteButtonModal: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },

  icon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 16,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    gap: 10,
  },
  pageButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#888',
    borderRadius: 5,
  },
  pageButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  pageNumber: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CoursesScreen;
