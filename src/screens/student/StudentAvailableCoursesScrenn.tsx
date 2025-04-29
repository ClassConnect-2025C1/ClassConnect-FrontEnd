import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const AvailableCoursesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { courses = [] } = route.params || {}; // cursos recibidos

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Courses</Text>
      <ScrollView contentContainerStyle={styles.courseList}>
        {courses.map((course) => (
          <View key={course.id} style={styles.courseCard}>
            <Text style={styles.courseText}>{course.title}</Text>
            <TouchableOpacity
              style={styles.enrollButton}
              onPress={() => {
                // Acción temporal: volver atrás
                navigation.goBack();
              }}
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
    backgroundColor: '#E0E0E0', // gris más claro
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row', // alinear horizontalmente
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseText: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
  enrollButton: {
    borderColor: '#BDBDBD', // borde apenas visible
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#E0E0E0', // mismo color que el fondo del card
  },
  enrollButtonText: {
    color: '#333', // texto gris oscuro
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
