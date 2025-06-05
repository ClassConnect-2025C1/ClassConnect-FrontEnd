import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Linking,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { API_URL } from '@env';
import { downloadAndShareFile } from '../../utils/FileDowloader';
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
  const [modules, setModules] = useState([]);
  const [resourceCurrentPage, setResourceCurrentPage] = useState(1);

  const filteredAssignments = assignments.filter((assignment) => {
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

  // Fetch student submissions for an assignment
const fetchStudentSubmissions = async (assignmentId) => {
  try {
    const response = await fetch(
      `${API_URL}/api/courses/${course.id}/assignment/${assignmentId}/submission`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      
      // Si la respuesta tiene una estructura como { data: {...} }
      if (data.data) {
        return data.data;
      }
      
      // Si la respuesta es directamente el objeto submission
      if (data.id || data.grade !== undefined) {
        return data;
      }
      
      // Si es un array con un elemento
      if (Array.isArray(data) && data.length > 0) {
        return data[0];
      }
      
      return null;
    } else if (response.status === 404) {
      // 404 significa que el estudiante no ha hecho submission aún
      console.log('No submission found for this assignment');
      return null;
    }
  } catch (error) {
    console.error('Error fetching submission:', error);
  }
  return null;
};

  // Fetch modules/resources for the course
  const fetchModules = async () => {
    try {
      if (!token) {
        throw new Error('No token found');
      }
      const response = await fetch(
        `${API_URL}/api/courses/${course.id}/resources`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) {
        throw new Error('Failed to fetch modules');
      }
      const data = await response.json();
      if (data && Array.isArray(data.modules)) {
        const formattedModules = data.modules.map((item) => ({
          module_id: item['module_id'],
          title: item['module_name'],
          order: item['order'],
          resources: item['resources'].map(r => ({
            id: r['id'],
            type: r['type'],
            name: r['name'],
            url: r['url'],
          })),
        }));
        setModules(formattedModules);
      } else {
        console.error('Modules data is not in the expected format:', data);
        setModules([]);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      setModules([]);
    }
  };

  // Fetch assignments for the course
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
        // Obtener submissions para cada assignment
        const assignmentsWithSubmissions = await Promise.all(
          data.data.map(async (assignment) => {
            const submission = await fetchStudentSubmissions(assignment.id);
            return {
              ...assignment,
              submission: submission
            };
          })
        );

        setAssignments(assignmentsWithSubmissions);
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

  // Lógica de paginación para Resources
  const totalResourcePages = Math.ceil(modules.length / ITEMS_PER_PAGE);
  const startResourceIndex = (resourceCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedModules = modules.slice(startResourceIndex, startResourceIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    if (isFocused) {
      fetchAssignments();
      fetchModules();
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
            Start date: {course.startDate || 'Not specified'}{' '}
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
                  {item.time_limit === 0
                    ? 'No time limit'
                    : `${item.time_limit} mins`}
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

                <View style={styles.buttonRow}>
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
                      {item.status !== 'pending'
                        ? 'Continue Assignment'
                        : 'Start Assignment'}
                    </Text>
                  </TouchableOpacity>

                  {/* Botón View Grade - solo si hay calificación */}
                  {item.submission &&
                    item.submission.grade !== null  &&
                    item.submission.grade !== undefined && (
                      <TouchableOpacity
                        style={styles.viewGradeButton}
                        onPress={() =>
                          navigation.navigate('StudentShowGrade', {
                            feedback: item.submission.feedback,
                            grade: item.submission.grade,
                            assignmentTitle: item.title,
                          })
                        }
                      >
                        <Text style={styles.viewGradeButtonText}>View Grade</Text>
                      </TouchableOpacity>
                    )}
                </View>
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
        ) : activeTab === 'Resources' ? (
          <View style={styles.resourcesContainer}>
            {/* Mostrar módulos paginados */}
            {paginatedModules.map((module, moduleIndex) => (
              <View key={moduleIndex} style={styles.moduleContainer}>
                {/* Header del módulo solo con título */}
                <View style={styles.moduleHeader}>
                  <Text style={styles.moduleTitle}>
                    Module {startResourceIndex + moduleIndex + 1}: {module.title}
                  </Text>
                </View>

                <ScrollView
                  style={styles.resourcesScrollView}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {module.resources.map((resource, resourceIndex) => (
                    <TouchableOpacity
                      key={resourceIndex}
                      style={styles.resourceItem}
                      onPress={() => {
                        if (resource.url) {
                          console.log('Resource URL:', resource.url);
                          Linking.openURL(resource.url);
                        }
                      }}
                    >
                      <View style={styles.resourceContent}>
                        <Text style={styles.resourceText}>{resource.name}</Text>
                        <Text style={styles.resourceType}>
                          {resource.type === 'file' ? '📁' : '🔗'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ))}

            {/* Botones paginación para Resources */}
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                disabled={resourceCurrentPage === 1}
                onPress={() => setResourceCurrentPage((prev) => Math.max(prev - 1, 1))}
                style={[
                  styles.pageButton,
                  resourceCurrentPage === 1 && styles.pageButtonDisabled,
                ]}
              >
                <Text style={styles.pageButtonText}>Prev</Text>
              </TouchableOpacity>

              <Text style={styles.pageIndicator}>
                Page {resourceCurrentPage} of {totalResourcePages}
              </Text>

              <TouchableOpacity
                disabled={resourceCurrentPage === totalResourcePages}
                onPress={() =>
                  setResourceCurrentPage((prev) => Math.min(prev + 1, totalResourcePages))
                }
                style={[
                  styles.pageButton,
                  resourceCurrentPage === totalResourcePages && styles.pageButtonDisabled,
                ]}
              >
                <Text style={styles.pageButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.detail}>No data available for this tab.</Text>
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
  detailRow: {
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5.7,
  },
  submitButton: {
    borderWidth: 1,
    borderColor: '#D3D3D3',
    borderRadius: 7.6,
    paddingVertical: 4.8,
    paddingHorizontal: 11.4,
    flex: 1,
    marginRight: 10,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 12.4,
    textAlign: 'center',
  },
  viewGradeButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 4.8,
    paddingHorizontal: 9.5,
    borderRadius: 7.6,
  },
  viewGradeButtonText: {
    color: '#fff',
    fontSize: 12.4,
    fontWeight: 'bold',
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
  resourcesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  moduleContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  resourcesScrollView: {
    maxHeight: 100,
    marginBottom: 12,
  },
  resourceItem: {
    backgroundColor: '#fff',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resourceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resourceText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  resourceType: {
    fontSize: 18,
    marginLeft: 8,
  },
});