import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
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

  // Función para determinar el color de la calificación (1-10) - Colores universitarios
  const getGradeColor = (grade: number) => {
    if (grade >= 9) return '#1e3a8a'; // Azul navy universitario
    if (grade >= 7) return '#1e40af'; // Azul académico
    if (grade >= 5) return '#059669'; // Verde serio
    if (grade >= 3) return '#d97706'; // Ámbar profesional
    return '#dc2626'; // Rojo académico
  };

  const getGradeColorLight = (grade: number) => {
    if (grade >= 9) return '#1e3a8a20';
    if (grade >= 7) return '#1e40af20';
    if (grade >= 5) return '#05966920';
    if (grade >= 3) return '#d9770620';
    return '#dc262620';
  };

  const getGradeEmoji = (grade: number) => {
    if (grade >= 9) return '🌟';
    if (grade >= 7) return '😊';
    if (grade >= 5) return '🙂';
    if (grade >= 3) return '😐';
    return '😔';
  };

  const getGradeMessage = (grade: number) => {
    if (grade >= 9) return 'Outstanding';
    if (grade >= 7) return 'Proficient';
    if (grade >= 5) return 'Satisfactory';
    if (grade >= 3) return 'Needs improvement';
    return 'Below expectations';
  };

  const gradeColor = getGradeColor(grade);
  const gradeColorLight = getGradeColorLight(grade);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2C2C2C" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          <Text>🎓 Grade Report</Text>
        </Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Assignment card */}
          <View style={styles.assignmentCard}>
            <View style={styles.assignmentHeader}>
              <Text style={styles.assignmentIcon}>📚</Text>
              <Text style={styles.assignmentLabel}>Assignment</Text>
            </View>
            <Text style={styles.assignmentTitle}>{assignmentTitle}</Text>
          </View>

          {/* Smaller grade card */}
          <View style={styles.gradeCard}>
            <Text style={styles.gradeLabel}>Your Grade</Text>

            <View style={[styles.gradeCircle, { backgroundColor: gradeColor }]}>
              <Text style={styles.gradeText}>{grade}</Text>
              <View style={styles.gradeEmojiContainer}>
                <Text style={styles.gradeEmoji}>{getGradeEmoji(grade)}</Text>
              </View>
            </View>

            <Text style={styles.gradeSubtext}>out of 10 points</Text>
            <View
              style={[
                styles.gradeMessageContainer,
                { backgroundColor: gradeColorLight },
              ]}
            >
              <Text style={[styles.gradeMessage, { color: gradeColor }]}>
                {getGradeMessage(grade)}
              </Text>
            </View>
          </View>

          {/* Teacher comments - Expanded area */}
          <View style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
              <Text style={styles.feedbackIcon}>💭</Text>
              <Text style={styles.feedbackLabel}>Feedback</Text>
            </View>
            <ScrollView
              style={styles.feedbackScrollContainer}
              nestedScrollEnabled={true}
            >
              <View style={styles.feedbackContent}>
                {feedback ? (
                  <Text style={styles.feedbackText}>{feedback}</Text>
                ) : (
                  <View style={styles.noFeedbackContainer}>
                    <Text style={styles.noFeedbackEmoji}>📄</Text>
                    <Text style={styles.noFeedbackText}>
                      No feedback provided
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* Done Button */}
      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Text style={styles.doneButtonText}>
          <Text>Done </Text>
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#2C2C2C',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 5,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  assignmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#2C2C2C',
  },
  assignmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  assignmentIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  assignmentLabel: {
    fontSize: 13,
    color: '#2C2C2C',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    lineHeight: 24,
  },
  gradeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  gradeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
  },
  gradeCircle: {
    width: 90, // Más pequeño
    height: 90, // Más pequeño
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    position: 'relative',
  },
  gradeText: {
    fontSize: 32, // Más pequeño
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  gradeEmojiContainer: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: 30, // Más pequeño
    height: 30, // Más pequeño
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  gradeEmoji: {
    fontSize: 16, // Más pequeño
  },
  gradeSubtext: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 12,
    fontWeight: '500',
  },
  gradeMessageContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  gradeMessage: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 280, // Altura fija más grande
    overflow: 'hidden',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  feedbackIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  feedbackLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  feedbackScrollContainer: {
    flex: 1,
    maxHeight: 220, // Altura máxima para el scroll
  },
  feedbackContent: {
    padding: 16,
    minHeight: 200, // Altura mínima
  },
  feedbackText: {
    fontSize: 15,
    color: '#495057',
    lineHeight: 22,
    textAlign: 'justify',
  },
  noFeedbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    height: 180,
  },
  noFeedbackEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  noFeedbackText: {
    fontSize: 15,
    color: '#ADB5BD',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  doneButton: {
    backgroundColor: '#2C2C2C',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StudentShowGrade;
