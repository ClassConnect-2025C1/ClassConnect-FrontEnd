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
} from 'react-native';
import { API_URL } from '@env';
import Icon from 'react-native-vector-icons/FontAwesome';

const CoursesScreen = () => {
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
  const [favoriteCourses, setFavoriteCourses] = useState<Set<number>>(
    new Set(),
  );

  useEffect(() => {
    const fetchUserCourses = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
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
        console.error('Error al obtener los cursos del usuario:', error);
      }
    };

    fetchUserCourses();
  }, []);

  const toggleFavorite = (courseId: number) => {
    setFavoriteCourses((prevFavorites) => {
      const newFavorites = new Set(prevFavorites);
      if (newFavorites.has(courseId)) {
        newFavorites.delete(courseId);
      } else {
        newFavorites.add(courseId);
      }
      return newFavorites;
    });
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

      <ScrollView contentContainerStyle={styles.courseList}>
        {courses.map((course, index) => (
          <TouchableOpacity
            key={course.id}
            style={[
              styles.courseCard,
              { backgroundColor: cardColors[index % cardColors.length] },
            ]}
            onPress={() =>
              navigation.navigate('StudentCourseDetail', { course })
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
        onPress={() => navigation.navigate('AvailableCourses', { courses })}
      >
        <Text style={styles.buttonText}>Available courses</Text>
      </TouchableOpacity>

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  courseContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});

export default CoursesScreen;
