import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import StatusOverlay from '@/components/StatusOverlay';
import { useNavigation, useRoute} from '@react-navigation/native';
import { API_URL } from '@env';

interface RouteParams {
  course_id: string;
  assignment_id: string;
  submission_id: string;
  token: string;
  currentFeedback?: string;
  currentGrade?: number;
}

const TeacherQualifyAssignment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [saveChangueConfirmed, setSaveChangueConfirmed] = useState(false);
  const [comment, setComment] = useState('');
  const [grade, setGrade] = useState('');
  const [commentError, setCommentError] = useState('');
  const [gradeError, setGradeError] = useState('');
  
  const navigation = useNavigation();
  const route = useRoute();
  const { course_id, assignment_id, submission_id, token, currentFeedback, currentGrade } = route.params as RouteParams;

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
      


      <Text style={styles.label}>Comment</Text>
      <TextInput
        style={[
          styles.input, 
          { height: 100, textAlignVertical: 'top' },
          commentError ? styles.inputError : null
        ]}
        multiline
        placeholder="Enter your comment"
        value={comment}
        onChangeText={(text) => {
          setComment(text);
          if (commentError) setCommentError('');
        }}
      />
      {commentError ? <Text style={styles.errorText}>{commentError}</Text> : null}

      <Text style={styles.label}>Grade</Text>
      <TextInput
        style={[
          styles.input, 
          { width: 80 },
          gradeError ? styles.inputError : null
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
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleSubmit}
        >
          <Text style={styles.buttonText}>Submit Grade</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
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
  addFileButton: {
    backgroundColor: '#eee',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  filesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  fileItem: {
    backgroundColor: '#ddd',
    padding: 8,
    margin: 5,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileName: {
    fontSize: 12,
    color: '#333',
    marginRight: 5,
  },
  removeButton: {
    backgroundColor: '#ff4d4d',
    borderRadius: 50,
    padding: 5,
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
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
  disabledButton: {
    opacity: 0.6,
  },


});

export default TeacherQualifyAssignment;