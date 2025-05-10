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
import { API_URL } from '@env';
import { downloadAndShareFile } from '../../utils/FileDowloader';
import { FlatList } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import { isValidDate } from '../../Errors/ValidationsEditCourse';

export default function CourseDetail({ route }) {
  const { course, userId } = route.params;
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('Assignments');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(
        `${API_URL}/api/courses/${course.id}/assignments`,
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

      if (data && Array.isArray(data.data)) {
        setAssignments(data.data);
      } else {
        console.error('Assignments data is not in the expected format');
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

  const handleSubmission = async (assignmentId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const result = await DocumentPicker.getDocumentAsync({ multiple: true });

      if (result.canceled) return;

      const files = await Promise.all(
        result.assets.map(async (file) => {
          const fileContent = await fetch(file.uri); 
          const contentBlob = await fileContent.blob();
          const base64Content = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(contentBlob);
          });

          return {
            name: file.name,
            content: base64Content.split(',')[1], 
            size: Number(file.size),
          };
        }),
      );

      const body = {
        course_id: Number(course.id),
        assignment_id: Number(assignmentId),
        content: 'This is the submission from me, user1',
        files: files,
      };
      console.log('Submission body:', body);

      const response = await fetch(
        `${API_URL}/api/courses/${course.id}/assignment/${assignmentId}/submission/${userId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) throw new Error('Failed to submit assignment');

      alert('Submission successful!');
    } catch (err) {
      console.error(err);
      alert('Submission failed!');
    }
  };


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

        <Text style={styles.detail}>
          Created by: {course.created_by || 'Unknown'}
        </Text>
        <Text style={styles.detail}>
          Capacity: {course.capacity || 'Not specified'}
        </Text>
        <Text style={styles.detail}>
          {course.eligibility_criteria || "Don't have eligibility criteria."}
        </Text>

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
        {loading ? (
          <Text>Loading assignments...</Text>
        ) : activeTab === 'Assignments' ? (
          <FlatList
            contentContainerStyle={styles.contentContainer}
            data={assignments}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.itemContainer}>
                <Text style={styles.itemText}>{item.title}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
                <Text style={styles.itemText}>
                  Due: {new Date(item.deadline).toLocaleDateString()}
                </Text>

                {Array.isArray(item.files) && item.files.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    {item.files.map((file, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.downloadButton}
                        onPress={() => downloadAndShareFile(file)}
                      >
                        <Text style={styles.downloadButtonText}>
                          Download {file.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.submitButton}
                  
                  onPress={() => 
                    handleSubmission(item.id)}
                >
                  <Text style={styles.submitButtonText}>Enter Submission</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text>No assignments available</Text>}
            refreshing={loading}
            onRefresh={fetchAssignments}
          />
        ) : (
          <ScrollView contentContainerStyle={styles.contentContainer}>
            <View style={styles.itemContainer}>
              <Text style={styles.itemText}>Course Resources</Text>
              <Text style={styles.itemDescription}>
                Here you will find resources such as slides, books, and other
                materials related to this course.
              </Text>
            </View>
          </ScrollView>
        )}
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
  itemDescription: {
    fontSize: 12,
    color: '#777',
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: 'transparent',
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginTop: 10,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#D3D3D3',
  },
  submitButtonText: {
    color: 'black',
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
  downloadButton: {
    marginTop: 5,
    backgroundColor: '#2196F3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  detail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
