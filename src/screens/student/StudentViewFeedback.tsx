import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  TextInput,
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
  const [selectedRating, setSelectedRating] = useState('Any');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const [feedbacks, setFeedbacks] = useState([]);
  const { token } = useAuth();

  const { userId } = route.params;
  const ITEMS_PER_PAGE = 3;
  const [currentPage, setCurrentPage] = useState(1);
  
  // Estados para el modal de resumen IA
  const [showAISummaryModal, setShowAISummaryModal] = useState(false);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [aiSummaryError, setAiSummaryError] = useState('');


  
  useEffect(() => {
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

    fetchFeedbacks();
  }, [userId, token]);

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

  // Función para formatear fechas a YYYY-MM-DD
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const filteredFeedbacks = (feedbacks?.data || []).filter((f) => {
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

  const totalPages = Math.ceil(filteredFeedbacks.length / ITEMS_PER_PAGE);

  const paginatedFeedbacks = filteredFeedbacks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Función para generar resumen con IA
  const handleGenerateAISummary = async () => {
    // Verificar si hay feedbacks
    if (!feedbacks?.data || feedbacks.data.length === 0) {
      setAiSummaryError('No feedbacks available to generate a summary.');
      setShowAISummaryModal(true);
      return;
    }

    setShowAISummaryModal(true);
    setAiSummaryLoading(true);
    setAiSummaryError('');
    setAiSummary('');
    
    try {
      const response = await fetch(
        `${API_URL}/api/courses/user/${userId}/ai-feedback-analysis`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        // Asumiendo que el endpoint retorna un objeto con la propiedad 'summary' o 'analysis'
        setAiSummary(data.summary || data.analysis || data.message || 'Summary generated successfully');
      } else {
        setAiSummaryError('Failed to generate AI summary. Please try again.');
      }
    } catch (error) {
      console.error('Error generating AI summary:', error);
      setAiSummaryError('Network error. Please check your connection and try again.');
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const handleCloseAISummaryModal = () => {
    setShowAISummaryModal(false);
    setAiSummary('');
    setAiSummaryError('');
  };

  // Renderizar el modal de resumen IA
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
            <Text style={styles.modalTitle}>AI Feedback Summary</Text>
            <TouchableOpacity onPress={handleCloseAISummaryModal}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {aiSummaryLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5B6799" />
              <Text style={styles.loadingText}>Generating your feedback summary...</Text>
            </View>
          ) : aiSummaryError ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="info" size={48} color="#ff9800" />
              <Text style={styles.errorTitle}>No Summary Available</Text>
              <Text style={styles.errorMessage}>{aiSummaryError}</Text>
              {feedbacks?.data && feedbacks.data.length > 0 && (
                <TouchableOpacity 
                  style={styles.retryButton} 
                  onPress={handleGenerateAISummary}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : aiSummary ? (
            <ScrollView style={styles.summaryContainer}>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryText}>{aiSummary}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleCloseAISummaryModal}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header y back button */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            paddingVertical: 6,
            paddingHorizontal: 12,
            backgroundColor: '#F0F0F0',
            borderRadius: 8,
            marginLeft: -1,
            marginTop: -11,
          }}
        >
          <Text
            style={[styles.backButtonText, { fontSize: 16, color: '#2c3e50' }]}
          >
            Back
          </Text>
        </TouchableOpacity>
        <Text
          style={[
            styles.header,
            { flex: 1, textAlign: 'center', marginLeft: -40 },
          ]}
        >
          Course Feedbacks
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        {/* Rating */}
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

        {/* Fecha desde / hasta - botones que abren el DateTimePicker */}
        <View style={styles.dateFiltersContainer}>
          <View style={styles.singleDateFilter}>
            <Text style={styles.dateLabel}>From:</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() =>
                showDatePicker(
                  fromDate ? new Date(fromDate) : null,
                  setFromDate,
                )
              }
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
              onPress={() =>
                showDatePicker(toDate ? new Date(toDate) : null, setToDate)
              }
            >
              <Text style={{ color: toDate ? '#000' : '#999' }}>
                {toDate ? formatDate(toDate) : 'Select date'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionHeader}>Feedbacks</Text>
      <View style={styles.feedbackList}>
        {paginatedFeedbacks.map((item) => (
          <View key={item.id.toString()} style={styles.feedbackItem}>
            <Text
              style={[
                styles.backButtonText,
                { fontSize: 18, color: '#2c3e50' },
              ]}
            >
              {item.course_title}
            </Text>

            <View style={styles.feedbackHeader}>
              <Text style={styles.feedbackContent}>{item.comment}</Text>
            </View>

            <Text style={styles.feedbackRating}>Rating: {item.rating}</Text>
            <Text style={[styles.dateText, { marginTop: 10 }]}>
              {new Date(item.created_at)
                .toLocaleDateString('es-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })
                .replace(/(\d+)\/(\d+)\/(\d+)/, '$3/$1/$2')}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 11, marginBottom: 20, alignItems: 'center' }}>
        <TouchableOpacity
          style={[styles.generateButton, { marginBottom: 15 }]}
          onPress={handleGenerateAISummary}
        >
          <MaterialIcons
            name="star"
            size={20}
            color="#5B6799"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.generateButtonText}>Generate AI summary</Text>
        </TouchableOpacity>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <TouchableOpacity
            style={[
              styles.backButton,
              currentPage === 1 && styles.disabledButton,
            ]}
            onPress={handlePrevPage}
            disabled={currentPage === 1}
          >
            <Text style={styles.backButtonText}>Prev</Text>
          </TouchableOpacity>

          <Text
            style={[
              styles.backButtonText,
              { marginHorizontal: 15, fontWeight: 'bold' },
            ]}
          >
            Page {currentPage} of {totalPages || 1}
          </Text>

          <TouchableOpacity
            style={[
              styles.backButton,
              currentPage === totalPages && styles.disabledButton,
            ]}
            onPress={handleNextPage}
            disabled={currentPage === totalPages}
          >
            <Text style={styles.backButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderAISummaryModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f7',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  dateFilter: {
    flex: 1,
    marginRight: 8,
  },
  ratingFilter: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 4,
    fontWeight: '500',
  },
  dateBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateText: {
    fontSize: 14,
    color: '#2c3e50',
    marginRight: 8,
  },
  ratingBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingText: {
    fontSize: 14,
    color: '#2c3e50',
  },
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
  feedbackItem: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    color: '#2c3e50',
    marginRight: 10,
  },
  feedbackRating: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  feedbackContent: {
    fontSize: 15,
    color: '#7f8c8d',
    lineHeight: 22,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 20,
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
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
  backButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
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
  ratingLabel: {
    fontSize: 13,
    color: '#2c3e50',
    marginRight: 6,
  },
  ratingCompactPicker: {
    height: 30,
    width: 70,
  },
  dateFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginHorizontal: 5,
  },
  dateButton: {
    flex: 1,
    paddingVertical: 10,
  },
  disabledButton: {
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  dateButtonText: {
    color: '#2c3e50',
    fontSize: 14,
  },

  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
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
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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

  // Estilos del Modal de IA
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff9800',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#5B6799',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  summaryContainer: {
    maxHeight: 400,
  },
  summaryContent: {
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    backgroundColor: '#f8f9ff',
    padding: 16,
    borderRadius: 12,
    textAlign: 'justify',
  },
  closeButton: {
    backgroundColor: '#5B6799',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default StudentViewFeedback;