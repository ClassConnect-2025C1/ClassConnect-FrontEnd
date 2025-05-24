import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { jwtDecode } from 'jwt-decode';
import { API_URL } from '@env';
import StatusOverlay from '../../components/StatusOverlay';
import { AcceptOnlyModal } from '../../components/Modals';
import { useAuth } from '../../navigation/AuthContext';

const TeacherFeedbackStudent = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { courseId, studentId } = route.params;

  const [comment, setComment] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const { token } = useAuth();

  const handleSubmitFeedback = async () => {
    if (!rating || comment.trim() === '') {
      setModalMessage('Please fill all fields.');
      setShowModal(true);
      return;
    }

    try {
      setIsLoading(true);
      if (!token) throw new Error('No token found');
      const decodedToken = jwtDecode(token);
      const teacherId = decodedToken.sub;

      const response = await fetch(
        `${API_URL}/api/courses/${courseId}/students/${studentId}/feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            teacher_id: teacherId,
            comment,
            rating,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error submitting feedback:', errorData);
        setIsLoading(false);
        return;
      }

      setTimeout(() => {
        setFeedbackSent(true);
        setTimeout(() => {
          setIsLoading(false);
          setFeedbackSent(false);
          navigation.goBack();
        }, 2000);
      }, 1500);
    } catch (error) {
      console.error('Submission error:', error);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <StatusOverlay
          loading={!feedbackSent}
          success={feedbackSent}
          loadingMsg="Sending feedback..."
          successMsg="Feedback sent correctly!"
        />
      ) : (
        <>
          <Text style={styles.title}>Feedback for Student</Text>

          <Text style={styles.label}>Comment</Text>
          <TextInput
            style={[styles.input, styles.commentInput]}
            value={comment}
            onChangeText={setComment}
            multiline
            placeholder="Write your comment here"
          />

          <AcceptOnlyModal
            visible={showModal}
            message={modalMessage}
            onAccept={() => setShowModal(false)}
            onClose={() => setShowModal(false)}
          />

          <Text style={styles.label}>Rating</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.ratingButton,
                  rating === num && styles.ratingButtonSelected,
                ]}
                onPress={() => setRating(num)}
              >
                <Text
                  style={[
                    styles.ratingButtonText,
                    rating === num && styles.ratingButtonTextSelected,
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSubmitFeedback}
            >
              <Text style={styles.buttonText}>Send</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    alignSelf: 'center',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
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
  commentInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
  },
  ratingButton: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  ratingButtonSelected: {
    backgroundColor: '#333',
    borderColor: '#333',
  },
  ratingButtonText: {
    fontSize: 16,
    color: '#333',
  },
  ratingButtonTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  sendButton: {
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
    color: 'white',
    fontWeight: 'bold',
  },
});

export default TeacherFeedbackStudent;
