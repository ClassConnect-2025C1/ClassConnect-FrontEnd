import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function CourseDetail({ route }) {
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
