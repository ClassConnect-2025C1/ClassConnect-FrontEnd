import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function CourseDetail({ route }) {
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

      <View style={[styles.courseCard, { backgroundColor: '#333' }]}>
        <Text style={styles.courseTitle}>{course.title}</Text>
        <Text style={styles.courseDescription}>{course.description}</Text>

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
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionButton}
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
          style={styles.optionButton}
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
        <Text style={{ textAlign: 'center' }}>Assignment list goes here</Text>
      )}
      {selectedOption === 'resources' && (
        <Text style={{ textAlign: 'center' }}>Resource list goes here</Text>
      )}
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
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  courseDescription: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  value: {
    color: '#fff',
    flexShrink: 1,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 30,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selected: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  createButton: {
    marginTop: 10,
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
