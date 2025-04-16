import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function TeacherCourseDetail({ route }) {
  const { course } = route.params;
  const navigation = useNavigation();

  const [selectedOption, setSelectedOption] = useState(null);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <View style={[styles.courseCard, { backgroundColor: course.color }]}>
        <Text style={styles.courseText}>{course.title}</Text>
        <Text style={styles.courseDescription}>{course.description}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Created by:</Text>
        <Text style={styles.value}>{course.createdBy}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Capacity:</Text>
        <Text style={styles.value}>{course.capacity}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Eligibility:</Text>
        <Text style={styles.value}>
          {course.eligibilityCriteria || 'Not specified'}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Start Date:</Text>
        <Text style={styles.value}>{course.startDate}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>End Date:</Text>
        <Text style={styles.value}>{course.endDate}</Text>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            selectedOption === 'assignments' && styles.selectedOptionButton,
          ]}
          onPress={() => setSelectedOption('assignments')}
        >
          <Text
            style={[
              styles.optionText,
              selectedOption === 'assignments' && styles.selected,
            ]}
          >
            Assignments
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.optionButton,
            selectedOption === 'resources' && styles.selectedOptionButton,
          ]}
          onPress={() => setSelectedOption('resources')}
        >
          <Text
            style={[
              styles.optionText,
              selectedOption === 'resources' && styles.selected,
            ]}
          >
            Resources
          </Text>
        </TouchableOpacity>
      </View>

      {selectedOption === 'assignments' && (
        <View style={styles.assignmentSection}>
          <Text style={styles.assignmentText}>Assignment list goes here</Text>
        </View>
      )}

      {selectedOption === 'resources' && (
        <View style={styles.resourceSection}>
          <Text style={styles.resourceText}>Resource list goes here</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => console.log('Create assignment pressed')}
      >
        <Text style={styles.createButtonText}>Create Assignment</Text>
      </TouchableOpacity>

      <View
        style={{
          height: 1,
          backgroundColor: '#ccc',
          opacity: 0.5,
          marginHorizontal: 20,
          marginBottom: 10,
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f4f4f4',
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  courseCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  courseText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  courseDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  label: {
    fontWeight: 'bold',
    color: '#000',
    marginRight: 10,
    flex: 1,
  },
  value: {
    color: '#000',
    flexShrink: 1,
    flex: 2,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
    marginBottom: 30,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
  },
  selectedOptionButton: {
    backgroundColor: '#007AFF',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  selected: {
    fontWeight: 'bold',
    color: '#fff',
  },
  assignmentSection: {
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resourceSection: {
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  assignmentText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
  },
  resourceText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
  },
  createButton: {
    marginTop: 10,
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
