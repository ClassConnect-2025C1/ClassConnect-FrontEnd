import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function CourseDetailScreen({ route }) {
  const { course } = route.params;
  const navigation = useNavigation();

  const [selectedOption, setSelectedOption] = useState(null);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <View style={[styles.courseCard, { backgroundColor: course.color }]}>
        <Text style={styles.courseText}>{course.name}</Text>
        <Text style={styles.courseDescription}>
          University of Buenos Aires (example description)
        </Text>
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

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => console.log('Create assignment pressed')}
      >
        <Text style={styles.createButtonText}>Create assignment</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  courseCard: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
    marginTop: 70,
  },
  courseText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  courseDescription: {
    fontSize: 16,
    color: '#fff',
    marginTop: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 0,
    marginBottom: 400,
  },
  optionButton: {
    padding: 10,
  },
  optionText: {
    fontSize: 18,
  },
  selected: {
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#B0B0B0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
  },

  backButtonText: {
    color: 'white',
    fontSize: 15,
  },
  backButton: {
    position: 'absolute',
    top: 43,
    left: 16,
    backgroundColor: '#d0d0d0',
    padding: 5,
    borderRadius: 10,
  },

  separator: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 10,
    width: '100%',
    alignSelf: 'center',
  },
});
