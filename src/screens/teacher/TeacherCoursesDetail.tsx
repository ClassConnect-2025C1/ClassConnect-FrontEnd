import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TeacherCourseDetail({ route }) {
  const { course } = route.params;
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState('Assignments');
  const [activeSubTab, setActiveSubTab] = useState('Assignments');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(
        `http://192.168.0.12:8002/${course.id}/assignments`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }

      const data = await response.json();
      console.log('Assignments data:', data);

      if (data && Array.isArray(data.data)) {
        setAssignments(data.data);
      } else {
        console.error('Assignments data is not in the expected format:', data);
        setAssignments([]);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

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
            onPress={() => {
              setActiveTab('Edit Course');
              navigation.navigate('TeacherEditCourseDetail', { course });
            }}
          >
            <Text
              style={[
                styles.tabTextLink,
                activeTab === 'Edit Course' && styles.activeTabText,
              ]}
            >
              Edit Course
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setActiveTab('Feedbacks');
              navigation.navigate('TeacherFeedbackCourse', { course });
            }}
          >
            <Text
              style={[
                styles.tabTextLink,
                activeTab === 'Feedbacks' && styles.activeTabText,
              ]}
            >
              Feedbacks
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setActiveTab('Members');
              navigation.navigate('TeacherMembersCourse', { course });
            }}
          >
            <Text
              style={[
                styles.tabTextLink,
                activeTab === 'Members' && styles.activeTabText,
              ]}
            >
              Members
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <View style={styles.subTabContainer}>
          <TouchableOpacity onPress={() => setActiveSubTab('Assignments')}>
            <Text
              style={[
                styles.subTabText,
                activeSubTab === 'Assignments' && styles.activeSubTabText,
              ]}
            >
              Assignments
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveSubTab('Resources')}>
            <Text
              style={[
                styles.subTabText,
                activeSubTab === 'Resources' && styles.activeSubTabText,
              ]}
            >
              Resources
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.separator} />
      </View>

      <ScrollView style={styles.contentContainer}>
        {loading ? (
          <Text>Loading assignments...</Text>
        ) : (
          activeSubTab === 'Assignments' &&
          assignments.map((assignment, index) => (
            <View key={index} style={styles.assignmentContainer}>
              <View style={styles.assignmentHeader}>
                <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                <Text style={styles.assignmentDate}>
                  {new Date(assignment.deadline).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.assignmentDescription}>
                {assignment.description}
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.smallButton}>
                  <Text style={styles.smallButtonText}>Edit assignment</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() =>
                    navigation.navigate('StudentsSubmissions', {
                      course,
                      assignmentId: assignment.id,
                    })
                  }
                >
                  <Text style={styles.smallButtonText}>See submissions</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
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

      <TouchableOpacity
        style={[
          styles.smallButton,
          { alignSelf: 'flex-end', marginBottom: 40 },
        ]}
        onPress={() =>
          navigation.navigate('TeacherCreateAssignments', { course })
        }
      >
        <Text style={styles.smallButtonText}>Create assignment</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 40,
    paddingHorizontal: 15,
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
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 0,
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
    justifyContent: 'center',
    gap: 30,
    marginBottom: 0,
  },
  subTabText: {
    fontSize: 16,
    color: '#555',
  },
  separator: {
    height: 1,
    backgroundColor: '#D3D3D3',
    marginVertical: 10,
  },
  activeSubTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
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
    borderRadius: 5,
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabTextLink: {
    fontSize: 16,
    color: '#555',
    marginHorizontal: 10,
    paddingVertical: 5,
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  createAssignmentButton: {
    backgroundColor: '#B0B0B0',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginBottom: 40,
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  createAssignmentButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
