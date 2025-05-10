import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function ShowCourseDetail() {
  const route = useRoute();
  const { course } = route.params;
  const navigation = useNavigation();
  console.log(course);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.subtitle}>
          {course.description || 'No description available'}
        </Text>

        <Text style={styles.detail}>
          Created by: {course.createdBy || 'Unknown'}
        </Text>
        <Text style={styles.detail}>
          Capacity: {course.capacity ?? 'Not specified'}
        </Text>
        <Text style={styles.detail}>
          {course.eligibility_criteria || "Don't have eligibility criteria."}
        </Text>
      </View>


    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFF',
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#F8F8F8',
    borderRadius: 15,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 15,
  },
  detail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  backButton: {
    marginTop: 30,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
