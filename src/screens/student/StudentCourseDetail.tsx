import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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

        <Text style={styles.detail}>
          Created by: {course.createdBy || 'Unknown'}
        </Text>
        <Text style={styles.detail}>
          Capacity: {course.capacity || 'Not specified'}
        </Text>
        <Text style={styles.detail}>
          Start date: {course.startDate || 'Not specified'}
        </Text>
        <Text style={styles.detail}>
          End date: {course.endDate || 'Not specified'}
        </Text>
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
    paddingTop: 30,
    paddingHorizontal: 16,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#F8F8F8',
    marginHorizontal: 0,
    marginTop: 60,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 13,
    color: '#555',
    marginBottom: 10,
  },
  detail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  eligibilityContainer: {
    marginVertical: 8,
  },
  chipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  eligibilityChip: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 6,
    marginTop: 6,
  },
  eligibilityText: {
    fontSize: 12,
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#D3D3D3',
  },
  activeTab: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  sectionContainer: {
    flex: 1,
    marginBottom: 16,
  },
  itemContainer: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 2,
  },
  itemText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 12,
    color: '#777',
    marginBottom: 6,
  },
  downloadButton: {
    marginTop: 4,
    backgroundColor: '#2196F3',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  submitButton: {
    borderWidth: 1,
    borderColor: '#D3D3D3',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 13,
  },
  feedbackContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  feedbackButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  feedbackButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    paddingTop: 0, // o marginTop: 4
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  pageButton: {
    padding: 6,
    marginHorizontal: 8,
    backgroundColor: '#ddd',
    borderRadius: 6,
  },
  pageButtonDisabled: {
    backgroundColor: '#eee',
  },
  pageButtonText: {
    fontSize: 12,
    color: '#333',
  },
  pageIndicator: {
    fontSize: 12,
    color: '#666',
  },
  searchInput: {
    height: 40,
    borderColor: '#CCC',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
});
