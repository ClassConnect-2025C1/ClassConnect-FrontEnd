import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { API_URL } from '@env';
import { useAuth } from '../../navigation/AuthContext';

const TeacherResumeFeedbacksScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { course } = route.params;
  const { token } = useAuth();

  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(
        `${API_URL}/api/courses/${course.id}/ai-feedback-analysis`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) throw new Error('Failed to fetch AI summary');
      const data = await response.json();

      setSummary(data.data || 'No summary available.');
    } catch (err) {
      console.error(err);
      setError('Could not load summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>AI Feedback Summary</Text>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#5B6799" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.refreshButton} onPress={fetchSummary}>
          <MaterialIcons
            name="refresh"
            size={20}
            color="#5B6799"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.refreshButtonText}>Regenerate summary</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TeacherResumeFeedbacksScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f7',
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  summaryBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 22,
  },
  refreshButton: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  refreshButtonText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});
