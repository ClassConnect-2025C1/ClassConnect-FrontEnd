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
import { useAuth } from '../../navigation/AuthContext';
import { API_URL } from '@env';
import { Feather } from '@expo/vector-icons';

export default function TeacherCourseDetail({ route }) {
  const { course } = route.params;
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState('Assignments');
  const [activeSubTab, setActiveSubTab] = useState('Assignments');
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
 


    return titleMatch || deadlineMatch || statusMatch ;
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
    } catch (error) {
      console.error('Error deleting assignment:', error);
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
  
        <View style={styles.tabContainer}>
          {/* ... tus tabs ... */}
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
  
      {/* Aquí NO ScrollView, solo View */}
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
                      assignmentId: assignment.id,
                    })
                  }
                >
                  <Text style={styles.smallButtonText}>See submissions</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          activeSubTab === 'Resources' && (
            <View style={styles.assignmentContainer}>
              <Text style={styles.assignmentTitle}>Course Resources</Text>
              <Text style={styles.assignmentDescription}>
                Here you will find resources such as slides, books, and other
                materials related to this course.
              </Text>
            </View>
          )
        )}
      </View>
  
      {/* Botones paginación */}
<View style={styles.paginationContainer}>
  <TouchableOpacity
    disabled={currentPage === 1}
    onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
    style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
  >
    <Text style={styles.pageButtonText}>Prev</Text>
  </TouchableOpacity>

  <Text style={styles.pageInfo}>
    Page {currentPage} of {totalPages}
  </Text>

  <TouchableOpacity
    disabled={currentPage === totalPages}
    onPress={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
    style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
  >
    <Text style={styles.pageButtonText}>Next</Text>
  </TouchableOpacity>
</View>

<TouchableOpacity
  style={styles.createAssignmentButton}
  onPress={() =>
    navigation.navigate('TeacherCreateAssignments', { course })
  }
>
  <Text style={styles.createAssignmentButtonText}>Create assignment</Text>
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
  createAssignmentButton: {
    backgroundColor: '#B0B0B0',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 35, // más redondeado y botón más grande
    marginBottom: 40,
    alignSelf: 'center', // centrado horizontal
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  createAssignmentButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
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
    marginVertical: 10,
    gap: 30, // espacio entre botones y texto
  },
  pageButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 15, // más redondeado
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  pageButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pageInfo: {
    fontSize: 16,
    color: '#333',
  },
});
