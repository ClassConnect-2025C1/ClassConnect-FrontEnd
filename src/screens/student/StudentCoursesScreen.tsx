import { useNavigation } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
} from 'react-native';
import { API_URL } from '@env';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '../../navigation/AuthContext';
import { AcceptOnlyModal } from '@/components/Modals';

const getColorForCourse = (id: number) => {
  const cardColors = [
    '#3A59D1',
    '#3D90D7',
    '#7AC6D2',
    '#605EA1',
    '#3A3960',
  ];
  return cardColors[id % cardColors.length];
};

const CoursesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [courses, setCourses] = useState<Course[]>([]);
  const [searchText, setSearchText] = useState('');
  const [favoriteCourses, setFavoriteCourses] = useState<Set<number>>(
    new Set(),
  );
  const { token } = useAuth();
  const [showAddFavoriteCourse, setAddFavoriteCourse] = useState(false);
  const [showDeleteFavoriteCourse, setDeleteFavoriteCourse] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchText.toLowerCase()) ||
      course.createdBy.toLowerCase().includes(searchText.toLowerCase()) ||
      course.startDate.toLowerCase().includes(searchText.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const { userId } = route.params;
  const refreshCourses = async () => {
    try {
      if (token) {
        const response = await fetch(`${API_URL}/api/courses/enrolled`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const text = await response.text();

        try {
          const json = JSON.parse(text);
          if (Array.isArray(json.data)) {
            setCourses(json.data);

            // Set favorites from backend
            const favoritesSet = new Set(
              json.data.filter((course) => course.is_favorite).map((c) => c.id),
            );
            setFavoriteCourses(favoritesSet);
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
      console.error('Error al obtener los cursos del usuario:', error);
    }
  };

  useEffect(() => {
    refreshCourses();
  }, []);

  const toggleFavorite = async (courseId: number) => {
    try {
      if (!token) return;

      const response = await fetch(
        `${API_URL}/api/courses/${courseId}/favorite/toggle`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        console.error('Error al marcar como favorito');
        return;
      }

      setFavoriteCourses((prevFavorites) => {
        const newFavorites = new Set(prevFavorites);
        if (newFavorites.has(courseId)) {
          setDeleteFavoriteCourse(true);
          newFavorites.delete(courseId);
        } else {
          setAddFavoriteCourse(true);
          newFavorites.add(courseId);
        }
        return newFavorites;
      });
    } catch (error) {
      console.error('Error al marcar como favorito:', error);
    }
  };

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

      <AcceptOnlyModal
        visible={showAddFavoriteCourse}
        message="The course has been added to your favorites."
        onAccept={() => setAddFavoriteCourse(false)}
        onClose={() => setAddFavoriteCourse(false)}
      />

      <AcceptOnlyModal
        visible={showDeleteFavoriteCourse}
        message="The course has been removed from your favorites."
        onAccept={() => setDeleteFavoriteCourse(false)}
        onClose={() => setDeleteFavoriteCourse(false)}
      />

      <ScrollView contentContainerStyle={styles.courseList}>
        {[...filteredCourses]
          .sort((a, b) => {
            const aFav = favoriteCourses.has(a.id);
            const bFav = favoriteCourses.has(b.id);
            if (aFav === bFav) return 0;
            return aFav ? -1 : 1;
          })
          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
          .map((course, index) => (
            <TouchableOpacity
              key={course.id}
              style={[
                styles.courseCard,
                { backgroundColor: getColorForCourse(course.id) },
              ]}
              onPress={() =>
                navigation.navigate('StudentCourseDetail', { course, userId })
              }
            >
              <View style={styles.courseContent}>
                <Text style={styles.courseText}>{course.title}</Text>
                <TouchableOpacity onPress={() => toggleFavorite(course.id)}>
                  <Icon
                    name={favoriteCourses.has(course.id) ? 'star' : 'star-o'}
                    size={24}
                    color="yellow"
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.availableCoursesButton}
        onPress={() =>
          navigation.navigate('AvailableCourses', {
            userId,
            onEnroll: refreshCourses,
          })
        }
      >
        <Text style={styles.buttonText}>Available Courses</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.availableCoursesButton}
        onPress={() =>
          navigation.navigate('StudentViewFeedback', {
            userId,
          })
        }
      >
        <Text style={styles.buttonText}>Feedbacks</Text>
      </TouchableOpacity>

      <View style={styles.paginationContainer}>
        <TouchableOpacity
          onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          style={[
            styles.pageButton,
            currentPage === 1 && styles.disabledButton,
          ]}
        >
          <Text style={styles.pageButtonText}>Prev</Text>
        </TouchableOpacity>

        <Text style={styles.pageInfo}>
          Page {currentPage} of {totalPages}
        </Text>

        <TouchableOpacity
          onPress={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          style={[
            styles.pageButton,
            currentPage === totalPages && styles.disabledButton,
          ]}
        >
          <Text style={styles.pageButtonText}>Next</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.separator} />

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => console.log('Icon 1')}
        >
          <Image
            source={require('../../../assets/images/courses/layers.png')}
            style={styles.icon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => console.log('Icon 2')}
        >
          <Image
            source={require('../../../assets/images/courses/imbox.png')}
            style={styles.icon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => console.log('Icon 3')}
        >
          <Image
            source={require('../../../assets/images/courses/settings.png')}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
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
    marginTop: 5,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  courseContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  availableCoursesButton: {
    backgroundColor: '#aaa',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    opacity: 0.5,
    marginHorizontal: 20,
    marginBottom: 5,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconContainer: {
    padding: 10,
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
    marginTop: 16,
    marginBottom: 16,
    gap: 16, // Si no funciona, usá `marginHorizontal` en los elementos hijos
  },
  pageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#6c757d', // gris
    borderRadius: 6,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  pageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pageInfo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 12,
    color: '#333',
  },
});

export default CoursesScreen;
