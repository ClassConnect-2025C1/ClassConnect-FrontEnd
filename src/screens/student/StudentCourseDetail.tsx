import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { useNavigation,useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';
import { downloadAndShareFile } from '../../utils/FileDowloader';
import { FlatList } from 'react-native';
import { useAuth } from '../../navigation/AuthContext';

export default function CourseDetail({ route }) {
  const { course, userId } = route.params;
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('Assignments');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const isFocused = useIsFocused();
  const [searchQuery, setSearchQuery] = useState('');


  const filteredAssignments = assignments.filter((assignment) => {
    console.log('Assignment:', assignment.status);
    const titleMatch = assignment.title
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    const deadlineMatch = assignment.deadline
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    const statusMatch = assignment.status
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    return titleMatch || deadlineMatch || statusMatch;
  });

  const ITEMS_PER_PAGE = 2;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(filteredAssignments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAssignments = filteredAssignments.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const fetchAssignments = async () => {
    try {
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
    if (isFocused) {
      fetchAssignments();
    }
  }, [isFocused]);

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
          Created by: {course.createdBy || 'Unknown'}
        </Text>
        <Text style={styles.detail}>
          Capacity: {course.capacity || 'Not specified'}
        </Text>
        <View style={styles.detailRow}>
          <Text style={styles.detail}>
            Start date: {course.startDate || 'Not specified'}
            End date: {course.endDate || 'Not specified'}
          </Text>
        </View>
        {Array.isArray(course.eligibilityCriteria) &&
        course.eligibilityCriteria.length > 0 ? (
          <View style={styles.eligibilityContainer}>
            <Text style={styles.detail}>Eligibility Criteria:</Text>

            <View style={styles.chipsWrapper}>
              {course.eligibilityCriteria.map((criteria, index) => (
                <View key={index} style={styles.eligibilityChip}>
                  <Text style={styles.eligibilityText}>{criteria}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text style={styles.detail}>No eligibility criteria available.</Text>
        )}

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
          <View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setCurrentPage(1);
              }}
            />
            {paginatedAssignments.map((item, index) => (
              <View key={index} style={styles.itemContainer}>
                <Text style={styles.itemText}>
                  <Text style={{ fontWeight: 'bold' }}>Title: </Text>
                  {item.title}
                </Text>
                <Text style={styles.itemText}>
                  <Text style={{ fontWeight: 'bold' }}>Due: </Text>
                  {new Date(item.deadline).toLocaleDateString()}
                </Text>
                <Text style={styles.itemText}>
                  <Text style={{ fontWeight: 'bold' }}>Status: </Text>
                  {item.status}
                </Text>
                <Text style={styles.itemText}>
                  <Text style={{ fontWeight: 'bold' }}>Time limit: </Text>
                  {item.time_limit}
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
                    navigation.navigate('StudentAssignmentScreen', {
                      course,
                      userId,
                      assignment: item,
                      onStarted: (startedAt) => {
                        setAssignments((prevAssignments) =>
                          prevAssignments.map((a) =>
                            a.id === item.id
                              ? { ...a, started_at: startedAt }
                              : a,
                          ),
                        );
                      },
                    })
                  }
                >
                  <Text style={styles.submitButtonText}>
                    {item.started_at
                      ? 'Continue Assignment'
                      : 'Start Assignment'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Paginación */}
            {assignments.length > ITEMS_PER_PAGE && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  disabled={currentPage === 1}
                  onPress={() => setCurrentPage((prev) => prev - 1)}
                  style={[
                    styles.pageButton,
                    currentPage === 1 && styles.pageButtonDisabled,
                  ]}
                >
                  <Text style={styles.pageButtonText}>Prev</Text>
                </TouchableOpacity>

                <Text style={styles.pageIndicator}>
                  Página {currentPage} de {totalPages}
                </Text>

                <TouchableOpacity
                  disabled={currentPage === totalPages}
                  onPress={() => setCurrentPage((prev) => prev + 1)}
                  style={[
                    styles.pageButton,
                    currentPage === totalPages && styles.pageButtonDisabled,
                  ]}
                >
                  <Text style={styles.pageButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
  paddingTop: 20,
  paddingHorizontal: 15,
},
backButton: {
  position: 'absolute',
  top: 40,
  left: 10,
  backgroundColor: '#E0E0E0',
  borderRadius: 19,
  paddingVertical: 5.7,
  paddingHorizontal: 11.4,
  zIndex: 10,
},
backButtonText: {
  fontSize: 13.3,
  fontWeight: 'bold',
  color: '#333',
},
headerContainer: {
  padding: 15,
  backgroundColor: '#F8F8F8',
  marginHorizontal: 0,
  marginTop: 57,
  marginBottom: 15,
  borderRadius: 11.4,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 1.9,
  elevation: 2,
},
title: {
  fontSize: 14.3,
  fontWeight: 'bold',
  color: '#333',
},
subtitle: {
  fontSize: 12.4,
  color: '#555',
  marginBottom: 9.5,
},
detail: {
  fontSize: 12.4,
  color: '#666',
  marginTop: 1.9,
},
eligibilityContainer: {
  marginVertical: 7.6,
},
chipsWrapper: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 5.7,
},
eligibilityChip: {
  backgroundColor: '#E0E0E0',
  borderRadius: 11.4,
  paddingVertical: 3.8,
  paddingHorizontal: 9.5,
  marginRight: 5.7,
  marginTop: 5.7,
},
eligibilityText: {
  fontSize: 11.4,
  color: '#333',
},
tabContainer: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  marginTop: 9.5,
},
tabButton: {
  paddingVertical: 5.7,
  paddingHorizontal: 11.4,
  borderRadius: 19,
  backgroundColor: '#D3D3D3',
},
activeTab: {
  backgroundColor: '#4CAF50',
},
tabText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 12.4,
},
sectionContainer: {
  flex: 1,
  marginBottom: 15,
},
itemContainer: {
  backgroundColor: '#F0F0F0',
  borderRadius: 9.5,
  padding: 11.4,
  marginBottom: 1.9,
},
itemText: {
  fontSize: 13.3,
  color: '#333',
  marginBottom: 1.9,
},
itemDescription: {
  fontSize: 11.4,
  color: '#777',
  marginBottom: 5.7,
},
downloadButton: {
  marginTop: 3.8,
  backgroundColor: '#2196F3',
  paddingVertical: 4.8,
  paddingHorizontal: 9.5,
  borderRadius: 5.7,
  alignSelf: 'flex-start',
},
downloadButtonText: {
  color: '#fff',
  fontSize: 11.4,
  fontWeight: '500',
},
submitButton: {
  borderWidth: 1,
  borderColor: '#D3D3D3',
  borderRadius: 7.6,
  paddingVertical: 4.8,
  paddingHorizontal: 11.4,
  alignSelf: 'flex-end',
  marginTop: 5.7,
},
submitButtonText: {
  color: '#000',
  fontSize: 12.4,
},
feedbackContainer: {
  alignItems: 'center',
  marginBottom: 19,
},
feedbackButton: {
  backgroundColor: '#4CAF50',
  paddingVertical: 9.5,
  paddingHorizontal: 22.8,
  borderRadius: 19,
},
feedbackButtonText: {
  color: '#fff',
  fontSize: 13.3,
  fontWeight: 'bold',
  paddingTop: 0,
},
paginationContainer: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 9.5,
},
pageButton: {
  padding: 5.7,
  marginHorizontal: 7.6,
  backgroundColor: '#ddd',
  borderRadius: 5.7,
},
pageButtonDisabled: {
  backgroundColor: '#eee',
},
pageButtonText: {
  fontSize: 11.4,
  color: '#333',
},
pageIndicator: {
  fontSize: 11.4,
  color: '#666',
},
searchInput: {
  height: 38,
  borderColor: '#CCC',
  borderWidth: 1,
  borderRadius: 7.6,
  paddingHorizontal: 9.5,
  marginBottom: 11.4,
},

});
