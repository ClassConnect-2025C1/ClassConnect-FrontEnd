import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

interface RouteParams {
  feedback: string;
  grade: number;
  assignmentTitle: string;
}

const StudentShowGrade = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { feedback, grade, assignmentTitle } = route.params as RouteParams;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Grade Details</Text>
        <Text style={styles.assignmentTitle}>{assignmentTitle}</Text>

        {/* Grade Box */}
        <View style={styles.gradeContainer}>
          <Text style={styles.gradeLabel}>Grade</Text>
          <View style={styles.gradeBox}>
            <Text style={styles.gradeText}>{grade}</Text>
          </View>
        </View>

        {/* Comment Box */}
        <View style={styles.commentContainer}>
          <Text style={styles.commentLabel}>Teacher's Feedback</Text>
          <View style={styles.commentBox}>
            <Text style={styles.commentText}>
              {feedback || 'No feedback provided'}
            </Text>
          </View>
        </View>
      </View>

      {/* Done Button */}
      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  content: {
    flex: 1,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  assignmentTitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
    fontStyle: 'italic',
  },
  gradeContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  gradeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  gradeBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 20,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  gradeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  commentContainer: {
    flex: 1,
    marginBottom: 20,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  commentBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 150,
  },
  commentText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  doneButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default StudentShowGrade;