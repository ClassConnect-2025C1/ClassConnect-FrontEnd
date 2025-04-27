import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { API_URL } from '@env'; 

export default function CourseDetail({ route }) {
  const { course } = route.params;
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('Assignments');

  const assignments = [
    "Implement Dijkstra's Algorithm",
    'Read Chapter 5 of the book',
    'Solve graph exercises 1 to 5',
  ];

  const resources = [
    'Slides Week 1',
    'Graph Theory eBook',
    'Sample Graph Data',
  ];
  

  return (
    <View style={styles.mainContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.headerContainer}>
        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.subtitle}>
          {course.description || 'No description available'}
        </Text>

        <View style={styles.courseInfo}>
          <Text style={styles.infoText}>
            <Text style={styles.boldText}>Created by: </Text>
            {course.createdBy}
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.boldText}>Capacity: </Text>
            {course.capacity}
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.boldText}>Eligibility: </Text>
            {course.eligibilityCriteria || 'Not specified'}
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.boldText}>Start Date: </Text>
            {course.startDate}
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.boldText}>End Date: </Text>
            {course.endDate}
          </Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'Assignments' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('Assignments')}
          >
            <Text style={styles.tabText}>Assignments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'Resources' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('Resources')}
          >
            <Text style={styles.tabText}>Resources</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {activeTab === 'Assignments' &&
            assignments.map((item, index) => (
              <View key={index} style={styles.itemContainer}>
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}

          {activeTab === 'Resources' &&
            resources.map((item, index) => (
              <View key={index} style={styles.itemContainer}>
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
        </ScrollView>
      </View>

      <View style={styles.feedbackContainer}>
        <TouchableOpacity
          style={styles.feedbackButton}
          onPress={() =>
            navigation.navigate('StudentFeedback', { courseId: course.id })
          }
        >
          <Text style={styles.feedbackButtonText}>Send Feedback</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 30,
    left: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  headerContainer: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#F8F8F8',
    marginHorizontal: 15,
    marginTop: 40,
    marginBottom: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 15,
  },
  courseInfo: {
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  boldText: {
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#D3D3D3',
  },
  activeTab: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sectionContainer: {
    flex: 1,
    marginBottom: 20,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  itemContainer: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  itemText: {
    fontSize: 14,
    color: '#333',
  },
  feedbackContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  feedbackButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  feedbackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
