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

  // Use effect para cargar los cursos al inicio
  useEffect(() => {
    const fetchUserCourses = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const response = await fetch(`http://0.0.0.0:7999/api/courses/`, {
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

  // Agregar el nuevo curso si llega desde la pantalla de creación
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

      <ScrollView contentContainerStyle={styles.courseList}>
        {courses.map((course, index) => (
          <TouchableOpacity
            key={course.id}
            style={[
              styles.courseCard,
              { backgroundColor: cardColors[index % cardColors.length] },
            ]}
            onPress={() =>
              navigation.navigate('TeacherCourseDetail', { course })
            }
          >
            <Text style={styles.courseText}>{course.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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
