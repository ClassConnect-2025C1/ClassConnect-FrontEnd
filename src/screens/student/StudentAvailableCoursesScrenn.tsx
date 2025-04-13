import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';


const availableCourses = [
  { id: 1, name: 'Biology' },
  { id: 2, name: 'Physics' },
  { id: 3, name: 'Philosophy' },
  { id: 4, name: 'Economics' },
];

const AvailableCoursesScreen = () => {
      const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Courses</Text>
      <ScrollView contentContainerStyle={styles.courseList}>


        {availableCourses.map((course) => (
          <TouchableOpacity key={course.id} style={styles.courseCard}>
            <Text style={styles.courseText}>{course.name}</Text>
          </TouchableOpacity>
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
    backgroundColor: '#888',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  courseText: {
    color: '#fff',
    fontSize: 18,
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
