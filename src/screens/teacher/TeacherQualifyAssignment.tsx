import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import StatusOverlay from '@/components/StatusOverlay';
import { useNavigation, useRoute } from '@react-navigation/native';
import { API_URL } from '@env';

interface RouteParams {
  course_id: string;
  assignment_id: string;
  submission_id: string;
  token: string;
  currentFeedback?: string;
  currentGrade?: number;
}

interface AIGradeResponse {
  feedback: string;
  grade: number;
}

const TeacherQualifyAssignment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [saveChangueConfirmed, setSaveChangueConfirmed] = useState(false);
  const [comment, setComment] = useState('');
  const [grade, setGrade] = useState('');
  const [commentError, setCommentError] = useState('');
  const [gradeError, setGradeError] = useState('');

  // Estados para el modal de IA
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIGradeResponse | null>(null);
  const [aiError, setAiError] = useState('');

  const navigation = useNavigation();
  const route = useRoute();
  const {
    course_id,
    assignment_id,
    submission_id,
    token,
    currentFeedback,
    currentGrade,
  } = route.params as RouteParams;

  // Inicializar con los valores actuales si existen
  React.useEffect(() => {
    if (currentFeedback) {
      setComment(currentFeedback);
    }
    if (currentGrade !== undefined && currentGrade !== null) {
      setGrade(currentGrade.toString());
    }
  }, [currentFeedback, currentGrade]);

  const validateFields = () => {
    let isValid = true;

    // Validar comentario
    if (!comment.trim()) {
      setCommentError('This field is necessary');
      isValid = false;
    } else {
      setCommentError('');
    }

    // Validar calificación
    if (!grade.trim()) {
      setGradeError('This field is necessary');
      isValid = false;
    } else if (isNaN(Number(grade)) || Number(grade) < 0) {
      setGradeError('Grade must be a valid number');
      isValid = false;
    } else {
      setGradeError('');
    }

    return isValid;
  };

  const handleAIGrade = async () => {
    setShowAIModal(true);
    setAiLoading(true);
    setAiError('');
    setAiResponse(null);

    try {
      // URL del endpoint que mostraste en la imagen
      const url = `${API_URL}/api/courses/${course_id}/assignment/${assignment_id}/submission/${submission_id}/ai-grade`;

      const response = await fetch(url, {
        method: 'GET', // Asumiendo que es GET según la imagen
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('AI Grade Response:', responseData);

        // Extraer los datos desde la estructura: { data: { feedback, grade } }
        const aiGradeData = responseData.data || responseData;
        let gradeValue = Number(aiGradeData.grade) || 0;

        // Normalizar la calificación: si es mayor a 10, dividir por 10
        // Esto convierte escalas 0-100 a 0-10
        if (gradeValue > 10) {
          gradeValue = gradeValue / 10;
        }

        setAiResponse({
          feedback: aiGradeData.feedback || 'No feedback provided',
          grade: gradeValue,
        });
      } else {
        setAiError('Failed to generate AI grade. Please try again.');
      }
    } catch (error) {
      console.error('Error getting AI grade:', error);
      setAiError('Network error. Please check your connection.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleUseAIGrade = () => {
    if (aiResponse) {
      setComment(aiResponse.feedback);
      setGrade(aiResponse.grade.toString());
      setCommentError('');
      setGradeError('');
    }
    setShowAIModal(false);
  };

  const handleCloseAIModal = () => {
    setShowAIModal(false);
    setAiResponse(null);
    setAiError('');
  };

  const handleSubmit = async () => {
    if (!validateFields()) {
      return;
    }

    setIsLoading(true);
    setSaveChangueConfirmed(false);

    try {
      // Construir la URL del endpoint
      const url = `${API_URL}/api/courses/${course_id}/assignment/${assignment_id}/submission/${submission_id}`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          feedback: comment.trim(),
          grade: Number(grade),
        }),
      });

      if (response.ok) {
        setSaveChangueConfirmed(true);

        // Esperar un poco para mostrar el mensaje de éxito y luego navegar hacia atrás
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        // En caso de error, volver al formulario
        setIsLoading(false);
        console.error('Failed to submit grade');
      }
    } catch (error) {
      console.error('Error submitting grade:', error);
      setIsLoading(false);
    }
  };

  const renderAIModal = () => (
    <Modal
      visible={showAIModal}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCloseAIModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI Generated Grade</Text>
            <TouchableOpacity onPress={handleCloseAIModal}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {aiLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5B6799" />
              <Text style={styles.loadingText}>
                Generating grade with AI...
              </Text>
            </View>
          ) : aiError ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error" size={48} color="#ff4444" />
              <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
              <Text style={styles.errorMessage}>{aiError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleAIGrade}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : aiResponse ? (
            <ScrollView style={styles.responseContainer}>
              <View style={styles.responseSection}>
                <Text style={styles.responseLabel}>Suggested Comment:</Text>
                <Text style={styles.responseText}>{aiResponse.feedback}</Text>
              </View>

              <View style={styles.responseSection}>
                <Text style={styles.responseLabel}>Suggested Grade:</Text>
                <Text style={styles.responseGrade}>{aiResponse.grade}</Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.useGradeButton}
                  onPress={handleUseAIGrade}
                >
                  <Text style={styles.useGradeButtonText}>Use This Grade</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelModalButton}
                  onPress={handleCloseAIModal}
                >
                  <Text style={styles.cancelModalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );

  return isLoading ? (
    <StatusOverlay
      loading={!saveChangueConfirmed}
      success={saveChangueConfirmed}
      loadingMsg="Submitting grade..."
      successMsg="Grade submitted successfully!"
    />
  ) : (
    <View style={styles.container}>
      <Text style={styles.title}>Submission From Student</Text>

      {/* Botón de Grade with AI */}
      <TouchableOpacity style={styles.aiButton} onPress={handleAIGrade}>
        <MaterialIcons
          name="star"
          size={20}
          color="#5B6799"
          style={{ marginRight: 6 }}
        />
        <Text style={styles.generateButtonText}>Grade with AI</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Comment</Text>
      <TextInput
        style={[
          styles.input,
          { height: 100, textAlignVertical: 'top' },
          commentError ? styles.inputError : null,
        ]}
        multiline
        placeholder="Enter your comment"
        value={comment}
        onChangeText={(text) => {
          setComment(text);
          if (commentError) setCommentError('');
        }}
      />
      {commentError ? (
        <Text style={styles.errorText}>{commentError}</Text>
      ) : null}

      <Text style={styles.label}>Grade</Text>
      <TextInput
        style={[
          styles.input,
          { width: 80 },
          gradeError ? styles.inputError : null,
        ]}
        placeholder="e.g. 10"
        value={grade}
        onChangeText={(text) => {
          setGrade(text);
          if (gradeError) setGradeError('');
        }}
        keyboardType="numeric"
      />
      {gradeError ? <Text style={styles.errorText}>{gradeError}</Text> : null}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.createButton} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit Grade</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>

      {renderAIModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    alignSelf: 'center',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    marginTop: 20,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#5B6799',
    marginBottom: 20,
  },
  generateButtonText: {
    color: '#5B6799',
    fontWeight: 'bold',
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    marginTop: 10,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  createButton: {
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 10,
    flex: 0.48,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#555',
    padding: 14,
    borderRadius: 10,
    flex: 0.48,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#ff0000',
    borderWidth: 1,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },

  // Estilos del Modal
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff4444',
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
  responseContainer: {
    maxHeight: 400,
  },
  responseSection: {
    marginBottom: 20,
  },
  responseLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  responseText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    backgroundColor: '#f8f9ff',
    padding: 12,
    borderRadius: 8,
  },
  responseGrade: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5B6799',
    textAlign: 'center',
    backgroundColor: '#f8f9ff',
    padding: 16,
    borderRadius: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  useGradeButton: {
    backgroundColor: '#5B6799',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  useGradeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelModalButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  cancelModalButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default TeacherQualifyAssignment;
