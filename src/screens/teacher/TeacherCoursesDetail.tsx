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

  const [activeTab, setActiveTab] = useState('Assignments');
  const [activeSubTab, setActiveSubTab] = useState('Assignments');

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

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, { backgroundColor: '#D3D3D3' }]}
            onPress={() =>
              navigation.navigate('TeacherEditCourseDetail', { course })
            }
          >
            <Text style={styles.tabText}>Edit Course</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'Feedbacks' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('Feedbacks')}
          >
            <Text style={styles.tabText}>Feedbacks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'Members' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('Members')}
          >
            <Text style={styles.tabText}>Members</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sección de Assignments y Resources con una línea de separación */}
      <View style={styles.sectionContainer}>
        <View style={styles.subTabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeSubTab === 'Assignments' && styles.activeTab,
            ]}
            onPress={() => setActiveSubTab('Assignments')}
          >
            <Text style={styles.tabText}>Assignments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeSubTab === 'Resources' && styles.activeTab,
            ]}
            onPress={() => setActiveSubTab('Resources')}
          >
            <Text style={styles.tabText}>Resources</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.separator} />
      </View>

      <ScrollView style={styles.contentContainer}>
        {activeSubTab === 'Assignments' && (
          <View style={styles.assignmentContainer}>
            <View style={styles.assignmentHeader}>
              <Text style={styles.assignmentTitle}>Dijkstra's Algorithm</Text>
              <Text style={styles.assignmentDate}>18/02/2025</Text>
            </View>
            <Text style={styles.assignmentDescription}>
              Implement Dijkstra's algorithm in python. The file to submit
              should be a .py file with a main function that receives as
              parameter a Graph instance, you can find the structure in
              Resources section.
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.smallButton}>
                <Text style={styles.smallButtonText}>Edit assignment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallButton}>
                <Text style={styles.smallButtonText}>See submissions</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeSubTab === 'Resources' && (
          <View style={styles.assignmentContainer}>
            <Text style={styles.assignmentTitle}>Course Resources</Text>
            <Text style={styles.assignmentDescription}>
              Here you will find resources such as slides, books, and other
              materials related to this course.
            </Text>
          </View>
        )}
      </ScrollView>
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
    marginBottom: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
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
    marginVertical: 20,
  },
  subTabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#D3D3D3',
    marginVertical: 10,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  assignmentContainer: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  assignmentDate: {
    fontSize: 14,
    color: '#888',
  },
  assignmentDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallButton: {
    backgroundColor: '#D3D3D3',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
