import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../navigation/AuthContext';
import { API_URL } from '@env';
import { Feather } from '@expo/vector-icons';
import StatusOverlay from '../../components/StatusOverlay';

export default function TeacherCourseDetail({ route }) {
  const { course } = route.params;
  const navigation = useNavigation();

  const isFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState('Assignments');
  const [activeSubTab, setActiveSubTab] = useState('Assignments');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saveChangueConfirmed, setChangueConfirmed] = useState(false);
  const [modules, setModules] = useState([]);
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
  const [resourceCurrentPage, setResourceCurrentPage] = useState(1);

  const totalPages = Math.ceil(filteredAssignments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAssignments = filteredAssignments.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  // Lógica de paginación para Resources
  const totalResourcePages = Math.ceil(modules.length / ITEMS_PER_PAGE);
  const startResourceIndex = (resourceCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedModules = modules.slice(startResourceIndex, startResourceIndex + ITEMS_PER_PAGE);

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
        const formattedModules = data.modules.map((item, index) => ({
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

  

  useEffect(() => {
    if (isFocused) {
      fetchAssignments();
      fetchModules();
    }
  }, [isFocused]);



  const handleDeleteAssignment = async (assignmentId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/courses/${course.id}/assignment/${assignmentId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to delete assignment');
      }

      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));

      setIsLoading(true);

      setTimeout(() => {
        setChangueConfirmed(true);

        setTimeout(() => {
          setIsLoading(false);
          setChangueConfirmed(false);
        }, 1500);
      }, 1000);
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  };


  const handleDeleteResource = async (resource) => {
    try {
      const deleteUrl = `${API_URL}/api/courses/${course.id}/resource/module/${module.id}/${resource.id}`;

      // Mostrar loading state
      setLoading(true);

      // Hacer la petición DELETE
      console.log("Vamos a eliminar el recurso:", resource);
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',

          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log('Resource deleted successfully');


      } else {
        // Manejar error de la API
        const errorData = await response.json();
        console.error('Error deleting resource:', errorData);
        setLoading(false);

        // Opcional: mostrar mensaje de error al usuario
        console.log('Error', 'Failed to delete resource. Please try again.');
      }

    } catch (error) {
      console.error('Network error deleting resource:', error);
      setLoading(false);

      // Manejar errores de red
      console.log('Error', 'Network error. Please check your connection and try again.');
    }
  };

  const handleDeleteModule = async (moduleId: string | number) => {
    try {
      const deleteUrl = `${API_URL}/api/courses/${course.id}/resource/module/${moduleId}`;

      // Mostrar loading state
      setLoading(true);

      // Hacer la petición DELETE
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log('Module deleted successfully');
      } else {
        // Manejar error de la API
        const errorData = await response.json();
        console.error('Error deleting module:', errorData);
        console.log('Error', 'Failed to delete module. Please try again.');
      }
    } catch (error) {
      console.error('Network error deleting module:', error);
      setLoading(false);
      console.log('Error', 'Network error. Please check your connection and try again.');
    }
  };


  return isLoading ? (
    <StatusOverlay
      loading={!saveChangueConfirmed}
      success={saveChangueConfirmed}
      loadingMsg="Deleting assignment..."
      successMsg="Assignment deleted successfully!"
    />
  ) : (
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
      </View>

      <View style={styles.sectionContainer}>
        <View style={styles.subTabContainer}>
          {['Assignments', 'Resources', 'Feedback', 'Members'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                setActiveSubTab(tab);
                if (tab === 'Feedback') {
                  navigation.navigate('TeacherFeedbackCourse', { course });
                } else if (tab === 'Members') {
                  navigation.navigate('TeacherMembersCourse', { course });
                }
              }}
            >
              <Text
                style={[
                  styles.subTabText,
                  activeSubTab === tab && styles.activeSubTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.separator} />
      </View>

      {activeSubTab === 'Assignments' && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search assignments..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setCurrentPage(1);
            }}
          />
        </View>
      )}

      <View style={styles.contentContainer}>
        {loading ? (
          <Text>Loading assignments...</Text>
        ) : activeSubTab === 'Assignments' ? (
          paginatedAssignments.map((assignment, index) => (
            <View key={index} style={styles.assignmentContainer}>
              <View style={styles.assignmentHeader}>
                <Text style={styles.assignmentTitle}>{assignment.title}</Text>

                <View style={styles.assignmentActions}>
                  <Text style={styles.assignmentDate}>
                    {new Date(assignment.deadline).toLocaleDateString()}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteAssignment(assignment.id)}
                  >
                    <Feather name="x" size={18} color="red" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.assignmentDescription}>
                {assignment.description}
              </Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() =>
                    navigation.navigate('TeacherEditAssigments', {
                      course,
                      assignment,
                    })
                  }
                >
                  <Text style={styles.smallButtonText}>Edit assignment</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() =>
                    navigation.navigate('StudentsSubmissions', {
                      course,
                      assignment,
                    })
                  }
                >
                  <Text style={styles.smallButtonText}>See submissions</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : activeSubTab === 'Resources' ? (

          <View style={styles.resourcesContainer}>
            {/* Mostrar módulos paginados */}
            {paginatedModules.map((module, moduleIndex) => (

              <View key={moduleIndex} style={styles.moduleContainer}>

                {/* Header del módulo con título y botón delete */}
                <View style={styles.moduleHeader}>
                  <Text style={styles.moduleTitle}>
                    Module {startResourceIndex + moduleIndex + 1}: {module.title}
                  </Text>
                  <View style={styles.moduleActions}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('EditModule', {
                        token,
                        course,
                        module,
                      })}
                      style={styles.editButton}
                    >
                      <Text style={styles.editText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteModule(module.module_id)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteText}> X </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  style={styles.resourcesScrollView}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {module.resources.map((resource, resourceIndex) => (
                    <View key={resourceIndex} style={styles.resourceItem}>
                      <Text style={styles.resourceText}>{resource.name}</Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteResource(resource)}
                        style={styles.deleteButton}
                      >
                        <Text style={styles.deleteText}> X </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() =>
                    navigation.navigate('AddResourceForModule', {
                      token,
                      course,
                      module
                    })
                  }
                >
                  <Text style={styles.addResourceText}>+ Add resources</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Add new module button */}
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() =>
                navigation.navigate('AddModuleScreen', {
                  token,
                  course,
                })
              }
            >
              <Text style={styles.smallButtonText}>Create module</Text>
            </TouchableOpacity>


            {/* Update order button */}
            <TouchableOpacity
              style={styles.updateOrderButton}
              onPress={() => navigation.navigate('UpdateOrder', { course, modules })}
            >
              <Text style={styles.updateOrderText}>Update Order</Text>
            </TouchableOpacity>

            {/* Botones paginación para Resources */}
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                disabled={resourceCurrentPage === 1}
                onPress={() => setResourceCurrentPage((prev) => Math.max(prev - 1, 1))}
                style={[
                  styles.pageButton,
                  resourceCurrentPage === 1 && styles.disabledButton,
                ]}
              >
                <Text style={styles.pageButtonText}>Prev</Text>
              </TouchableOpacity>

              <Text style={styles.pageInfo}>
                Page {resourceCurrentPage} of {totalResourcePages}
              </Text>

              <TouchableOpacity
                disabled={resourceCurrentPage === totalResourcePages}
                onPress={() =>
                  setResourceCurrentPage((prev) => Math.min(prev + 1, totalResourcePages))
                }
                style={[
                  styles.pageButton,
                  resourceCurrentPage === totalResourcePages && styles.disabledButton,
                ]}
              >
                <Text style={styles.pageButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>

      {/* Botones paginación */}
      {activeSubTab === 'Assignments' && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            disabled={currentPage === 1}
            onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            style={[
              styles.pageButton,
              currentPage === 1 && styles.disabledButton,
            ]}
          >
            <Text style={styles.pageButtonText}>Prev</Text>
          </TouchableOpacity>

          <Text style={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </Text>

          <TouchableOpacity
            disabled={currentPage === totalPages}
            onPress={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            style={[
              styles.pageButton,
              currentPage === totalPages && styles.disabledButton,
            ]}
          >
            <Text style={styles.pageButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeSubTab !== 'Resources' && (
        <View style={styles.bottomButtonsContainer}>
          <TouchableOpacity
            style={styles.createAssignmentButton}
            onPress={() =>
              navigation.navigate('TeacherCreateAssignments', { course })
            }
          >
            <Text style={styles.createAssignmentButtonText}>
              Create assignment
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editCourseButton}
            onPress={() => {
              setActiveTab('Edit Course');
              navigation.navigate('TeacherEditCourseDetail', { course });
            }}
          >
            <Text style={styles.createAssignmentButtonText}>Edit course</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 35,
    paddingHorizontal: 15,
  },
  backButton: {
    position: 'absolute',
    top: 30,
    left: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 25, // más redondeado
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
    borderRadius: 25, // más redondeado
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
    gap: 27, // 10% menos que 30
    marginBottom: -30,
  },
  subTabText: {
    fontSize: 14.5,
    color: '#555',
    paddingHorizontal: 1,
  },
  activeSubTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    fontSize: 14.5, // también reducir aquí para que sea consistente
  },
  separator: {
    height: 1,
    backgroundColor: '#D3D3D3',
    marginVertical: -5,
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
    borderRadius: 12, // más redondeado
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
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },

  editCourseButton: {
    backgroundColor: '#B0B0B0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
  },

  createAssignmentButton: {
    backgroundColor: '#A0A0A0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
  },

  createAssignmentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },

  assignmentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteIcon: {
    fontSize: 18,
    color: 'red',
    marginLeft: 10,
  },
  searchContainer: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // centra todo
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 12,
    gap: 30, // espacio entre botones y texto
  },
  pageButton: {
    paddingHorizontal: 17,
    paddingVertical: 5,
    backgroundColor: '#007AFF',
    borderRadius: 15,
    marginBottom: 0,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  pageButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pageInfo: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },

  detail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
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
  eligibilityContainer: {
    marginVertical: 2,
  },

  resourcesContainer: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  moduleContainer: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#f2f2f2',
    borderRadius: 6,
  },
  moduleTitle: {
    fontSize: 14, // más pequeño
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  resourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resourceText: {
    fontSize: 12,
    color: '#444',
    flexShrink: 1,
  },
  deleteButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#ffdddd',
    borderRadius: 4,
  },
  deleteText: {
    fontSize: 11,
    color: 'red',
    fontWeight: 'bold',
  },
  addResourceButton: {
    marginTop: 6,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: '#cccccc',
    borderRadius: 5,
  },
  addResourceText: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '600',
  },
  addModuleButton: {
    marginTop: 10,
    paddingVertical: 8,
    backgroundColor: '#cce5cc',
    borderRadius: 5,
    alignItems: 'center',
  },
  addModuleText: {
    fontSize: 13,
    color: '#2d862d',
    fontWeight: '700',
  },
  updateOrderButton: {
    marginTop: 10,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    alignItems: 'center',
  },
  updateOrderText: {
    fontSize: 12,
    color: '#666',
  },

  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 5,
  },

  moduleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#e6f3ff',
    borderRadius: 4,
  },
  editText: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  resourcesScrollView: {
  maxHeight: 60, // Altura para aproximadamente 3 recursos
  marginBottom: 5,
},

});
