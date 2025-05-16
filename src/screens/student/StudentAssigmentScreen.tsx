import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../navigation/AuthContext';
import { API_URL } from '@env';
import { downloadAndShareFile } from '../../utils/FileDowloader';

export default function StudentAssignmentScreen({ route }) {
  const { assignment, course, userId, onStarted } = route.params;
  const navigation = useNavigation();
  const { token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [assignmentDetails, setAssignmentDetails] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    // Si ya tenés el started_at apenas entras
    if (assignment.session?.started_at && onStarted) {
      onStarted(assignment.session.started_at);
    }
  }, []);

  const startCountdown = (startedAt, timeLimitMinutes) => {
    const endTime =
      new Date(startedAt).getTime() + timeLimitMinutes * 60 * 1000;

    const id = setInterval(() => {
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        clearInterval(id);
        setTimeLeft('00:00:00');
      } else {
        const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(
          2,
          '0',
        );
        const minutes = String(
          Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        ).padStart(2, '0');
        const seconds = String(
          Math.floor((diff % (1000 * 60)) / 1000),
        ).padStart(2, '0');
        setTimeLeft(`${hours}:${minutes}:${seconds}`);
      }
    }, 1000);

    setIntervalId(id);
  };

  const fetchAssignmentDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/courses/${course.id}/assignment/${assignment.id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch assignment details');
      }

      const data = await response.json();
      console.log('Assignment details:', data);
      setAssignmentDetails(data);

      if (
        data.session?.started_at &&
        data.data?.time_limit &&
        data.data.time_limit > 0
      ) {
        startCountdown(data.session.started_at, data.data.time_limit);
      }
    } catch (error) {
      console.error('Error fetching assignment details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentDetails();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  if (loading || !assignmentDetails) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  const { data, session } = assignmentDetails;
  const { title, description, deadline, files } = data || {};

  return (
    <View style={styles.mainContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {description || 'No description available'}
        </Text>
        <Text style={styles.detail}>
          Due: {new Date(deadline).toLocaleDateString()}
        </Text>

        {session?.started_at && timeLeft ? (
          <Text style={styles.timeLeftText}>Time remaining: {timeLeft}</Text>
        ) : (
          <Text style={styles.timeLeftText}>Assignment started yet</Text>
        )}

        {Array.isArray(files) && files.length > 0 && (
          <View style={{ marginTop: 10 }}>
            {files.map((file, idx) => (
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
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={() =>
            navigation.navigate('StudentEditAssigment', {
              course,
              userId,
              assignmentId: assignment.id,
            })
          }
        >
          <Text style={styles.submitButtonText}>Enter Submission</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  headerContainer: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 15,
  },
  detail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  countdownContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  countdownText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  questionContainer: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: 30,
    left: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  downloadButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  contentContainer: {
    padding: 20,
  },
  assignmentDetailContainer: {
    backgroundColor: '#FAFAFA',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  assignmentDetailText: {
    fontSize: 14,
    color: '#444',
  },
  buttonsContainer: {
    padding: 20,
  },
  timeLeftText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginTop: 10,
  },
});
