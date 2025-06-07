import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { API_URL } from '@env';
import { useAuth } from '../../navigation/AuthContext';
import { Picker } from '@react-native-picker/picker';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

const StudentViewFeedback = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { token } = useAuth();
  const { userId } = route.params;

  // ===============================================
  // ESTADOS PRINCIPALES
  // ===============================================
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedRating, setSelectedRating] = useState('Any');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Estados del modal de IA
  const [showAISummaryModal, setShowAISummaryModal] = useState(false);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [aiSummaryError, setAiSummaryError] = useState('');

  // ===============================================
  // CONSTANTES
  // ===============================================
  const ITEMS_PER_PAGE = 2;

  // ===============================================
  // EFECTOS
  // ===============================================
  useEffect(() => {
    fetchFeedbacks();
  }, [userId, token]);

  // ===============================================
  // FUNCIONES DE API
  // ===============================================
  const fetchFeedbacks = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/courses/user/${userId}/feedbacks`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch feedbacks');
      }
      
      const data = await response.json();
      setFeedbacks(data);
      setCurrentPage(1);
    } catch (error) {
      console.error(error);
      alert('Failed to load feedbacks.');
    }
  };

  // ===============================================
  // FUNCIONES DE UTILIDAD
  // ===============================================
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const showDatePicker = (currentDate, onChangeDate) => {
    DateTimePickerAndroid.open({
      value: currentDate || new Date(),
      onChange: (event, selectedDate) => {
        if (event.type === 'set' && selectedDate) {
          onChangeDate(selectedDate);
          setCurrentPage(1);
        }
      },
      mode: 'date',
      is24Hour: true,
    });
  };

  // ===============================================
  // FUNCIONES DE FILTRADO Y PAGINACIÓN
  // ===============================================
  const getFilteredFeedbacks = () => {
    return (feedbacks?.data || []).filter((f) => {
      if (selectedRating !== 'Any' && f.rating !== parseInt(selectedRating)) {
        return false;
      }

      const createdAt = new Date(f.created_at);

      if (fromDate) {
        const from = new Date(fromDate);
        if (isNaN(from.getTime())) return false;
        if (createdAt < from) return false;
      }

      if (toDate) {
        const to = new Date(toDate);
        if (isNaN(to.getTime())) return false;
        if (createdAt > to) return false;
      }
      
      return true;
    });
  };

  const filteredFeedbacks = getFilteredFeedbacks();
  const totalPages = Math.ceil(filteredFeedbacks.length / ITEMS_PER_PAGE);
  const paginatedFeedbacks = filteredFeedbacks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // ===============================================
  // FUNCIONES DE PAGINACIÓN
  // ===============================================
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // ===============================================
  // FUNCIONES DE IA
  // ===============================================
  const handleGenerateAISummary = async () => {
    if (!feedbacks?.data || feedbacks.data.length === 0) {
      setAiSummaryError('No feedbacks available to generate a summary.');
      setShowAISummaryModal(true);
      return;
    }

    setShowAISummaryModal(true);
    setAiSummaryLoading(true);
    setAiSummaryError('');
    setAiSummary('');

    const endpointsToTry = [
      `${API_URL}/api/courses/user/${userId}/ai-feedback-analysis`,
      `${API_URL}/api/courses/user/${userId}/feedback-analysis`,
      `${API_URL}/api/courses/user/${userId}/feedbacks/ai-analysis`,
      `${API_URL}/api/ai/feedback-analysis/${userId}`,
    ];

    let lastError = '';

    for (const endpoint of endpointsToTry) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const responseData = await response.json();

          if (responseData && responseData.data) {
            const cleanText = responseData.data.replace(/\\n/g, '\n').trim();
            setAiSummary(cleanText);
          } else {
            setAiSummary(
              responseData.summary ||
              responseData.analysis ||
              responseData.message ||
              'No content available'
            );
          }

          setAiSummaryLoading(false);
          return;
        } else if (response.status !== 404) {
          const errorText = await response.text();
          lastError = `Error ${response.status}: ${errorText}`;
          break;
        }
      } catch (error) {
        console.error(`❌ Network error on ${endpoint}:`, error);
        lastError = `Network error: ${error.message}`;
      }
    }

    setAiSummaryError(
      lastError || 'No working endpoint found. Please check with your backend team.'
    );
    setAiSummaryLoading(false);
  };

  const handleCloseAISummaryModal = () => {
    setShowAISummaryModal(false);
    setAiSummary('');
    setAiSummaryError('');
  };

  // ===============================================
  // COMPONENTES DE RENDERIZADO
  // ===============================================
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.header}>My Reviews</Text>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filterContainer}>
      {/* Rating Filter */}
      <View style={styles.ratingCompactBox}>
        <Text style={styles.ratingLabel}>Rating:</Text>
        <Picker
          selectedValue={selectedRating}
          style={styles.ratingCompactPicker}
          onValueChange={(itemValue) => {
            setSelectedRating(itemValue);
            setCurrentPage(1);
          }}
          dropdownIconColor="#2c3e50"
        >
          <Picker.Item label="Any" value="Any" />
          <Picker.Item label="5" value="5" />
          <Picker.Item label="4" value="4" />
          <Picker.Item label="3" value="3" />
          <Picker.Item label="2" value="2" />
          <Picker.Item label="1" value="1" />
        </Picker>
      </View>

      {/* Date Filters */}
      <View style={styles.dateFiltersContainer}>
        <View style={styles.singleDateFilter}>
          <Text style={styles.dateLabel}>From:</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => showDatePicker(fromDate ? new Date(fromDate) : null, setFromDate)}
          >
            <Text style={{ color: fromDate ? '#000' : '#999' }}>
              {fromDate ? formatDate(fromDate) : 'Select date'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.singleDateFilter}>
          <Text style={styles.dateLabel}>To:</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => showDatePicker(toDate ? new Date(toDate) : null, setToDate)}
          >
            <Text style={{ color: toDate ? '#000' : '#999' }}>
              {toDate ? formatDate(toDate) : 'Select date'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderFeedbackItem = (item) => (
    <View key={item.id.toString()} style={styles.feedbackItem}>
      <Text style={styles.courseTitle}>{item.course_title}</Text>
      
      <View style={styles.feedbackHeader}>
        <Text style={styles.feedbackContent}>{item.comment}</Text>
      </View>

      <Text style={styles.feedbackRating}>Rating: {item.rating}</Text>
      <Text style={styles.dateText}>
        {new Date(item.created_at)
          .toLocaleDateString('es-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
          .replace(/(\d+)\/(\d+)\/(\d+)/, '$3/$1/$2')}
      </Text>
    </View>
  );

  const renderPaginationControls = () => (
    <View style={styles.paginationContainer}>
      <TouchableOpacity
        style={styles.generateButton}
        onPress={handleGenerateAISummary}
      >
        <MaterialIcons name="star" size={20} color="#5B6799" style={{ marginRight: 6 }} />
        <Text style={styles.generateButtonText}>Generate AI summary</Text>
      </TouchableOpacity>

      <View style={styles.paginationButtons}>
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === 1 && styles.disabledButton]}
          onPress={handlePrevPage}
          disabled={currentPage === 1}
        >
          <Text style={styles.paginationButtonText}>Prev</Text>
        </TouchableOpacity>

        <Text style={styles.pageIndicator}>
          Page {currentPage} of {totalPages || 1}
        </Text>

        <TouchableOpacity
          style={[styles.paginationButton, currentPage === totalPages && styles.disabledButton]}
          onPress={handleNextPage}
          disabled={currentPage === totalPages}
        >
          <Text style={styles.paginationButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAISummaryModal = () => (
    <Modal
      visible={showAISummaryModal}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCloseAISummaryModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI Summary</Text>
            <TouchableOpacity onPress={handleCloseAISummaryModal}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {aiSummaryLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5B6799" />
              <Text style={styles.loadingText}>Generating your summary...</Text>
            </View>
          ) : aiSummaryError ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="info" size={48} color="#ff9800" />
              <Text style={styles.errorTitle}>No Summary Available</Text>
              <Text style={styles.errorMessage}>{aiSummaryError}</Text>
              {feedbacks?.data && feedbacks.data.length > 0 && (
                <TouchableOpacity style={styles.retryButton} onPress={handleGenerateAISummary}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : aiSummary ? (
            <ScrollView style={styles.summaryContainer}>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryText}>{aiSummary}</Text>
              </View>

              <TouchableOpacity style={styles.closeButton} onPress={handleCloseAISummaryModal}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );

  // ===============================================
  // RENDER PRINCIPAL
  // ===============================================
  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderFilters()}
      
      <View style={styles.divider} />

      <Text style={styles.sectionHeader}>Reviews</Text>
      
      <View style={styles.feedbackList}>
        {paginatedFeedbacks.map(renderFeedbackItem)}
      </View>

      {renderPaginationControls()}
      {renderAISummaryModal()}
    </SafeAreaView>
  );
};

// ===============================================
// ESTILOS
// ===============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f7',
    paddingHorizontal: 16,
    paddingTop: 40,
  },

  // Header
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2c3e50',
    flex: 1,
    marginLeft: -60, // Compensar el botón back para centrar
  },

  // Filters
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  ratingCompactBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#fff',
    width: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ratingLabel: {
    fontSize: 13,
    color: '#2c3e50',
    marginRight: 6,
  },
  ratingCompactPicker: {
    height: 30,
    width: 70,
  },
  dateFiltersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 12,
  },
  singleDateFilter: {
    flexDirection: 'column',
    width: 100,
    marginTop: -15,
  },
  dateLabel: {
    fontSize: 13,
    color: '#2c3e50',
    marginBottom: 2,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    backgroundColor: '#fff',
  },

  // Content
  divider: {
    height: 1,
    backgroundColor: '#dcdde1',
    marginVertical: 16,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#34495e',
  },
  feedbackList: {
    flex: 1,
  },

  // Feedback Items
  feedbackItem: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  feedbackHeader: {
    marginBottom: 6,
  },
  feedbackContent: {
    fontSize: 12,
    color: '#7f8c8d',
    lineHeight: 16,
  },
  feedbackRating: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#95a5a6',
  },

  // Pagination
  paginationContainer: {
    marginTop: 11,
    marginBottom: 20,
    alignItems: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  generateButtonText: {
    color: '#5B6799',
    fontWeight: 'bold',
    fontSize: 16,
  },
  paginationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  paginationButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  paginationButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pageIndicator: {
    marginHorizontal: 15,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#2c3e50',
  },
  disabledButton: {
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '90%',
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff9800',
    marginTop: 12,
    marginBottom: 6,
  },
  errorMessage: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#5B6799',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  summaryContainer: {
    maxHeight: 320,
  },
  summaryContent: {
    marginBottom: 14,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    backgroundColor: '#f8f9ff',
    padding: 12,
    borderRadius: 10,
    textAlign: 'justify',
  },
  closeButton: {
    backgroundColor: '#5B6799',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default StudentViewFeedback;