import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { API_URL } from '@env';
import { useNavigation } from '@react-navigation/native';
import { downloadAndShareFile } from '../../utils/FileDowloader';
import { useAuth } from '../../navigation/AuthContext';

const DownloadFilesScreen = ({ route }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const { course, assignment } = route.params;
  const navigation = useNavigation();
  const { token } = useAuth();

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const assignmentsRes = await fetch(
        `${API_URL}/api/courses/${course.id}/assignment/${assignment.id}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const assignmentsJson = await assignmentsRes.json();

      if (assignmentsJson?.data && assignmentsJson?.data?.id) {
        const assignment = assignmentsJson.data;

        try {
          const submissionsRes = await fetch(
            `${API_URL}/api/courses/${course.id}/assignment/${assignment.id}/submissions`,
            {
              method: 'GET',
              headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
              },
            },
          );

          const submissionsJson = await submissionsRes.json();

          setTasks([
            {
              ...assignment,
              session: assignmentsJson.session,
              submissions: submissionsJson?.data || [],
            },
          ]);
        } catch (err) {
          console.error(
            `Error fetching submissions for assignment ${assignment.id}`,
            err,
          );
          setTasks([
            {
              ...assignment,
              session: assignmentsJson.session,
              submissions: [],
            },
          ]);
        }
      } else {
        console.error('Unexpected response format:', assignmentsJson);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [course.id]);

  const handleDownloadFile = async (file) => {
    try {
      await downloadAndShareFile(file); // file.content y file.name
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const renderTaskItem = ({ item }) => (
    <View style={styles.taskItem}>
      <Text style={styles.taskTitle}>{item.title}</Text>

      {/* Archivos del assignment original */}
      {item.files?.length > 0 ? (
        item.files.map((file) => (
          <TouchableOpacity
            key={file.id ?? file.name}
            onPress={() => handleDownloadFile(file)}
            style={styles.fileButton}
          >
            <Text style={styles.fileName}>⬇️ {file.name}</Text>
          </TouchableOpacity>
        ))
      ) : (
        <Text>No files for this task.</Text>
      )}

      {/* Archivos de submissions */}
      {item.submissions?.length > 0 ? (
        <>
          <Text style={styles.submissionTitle}>Submissions</Text>
          {item.submissions.map((submission, index) => (
            <View
              key={submission.id || index}
              style={styles.submissionContainer}
            >
              {/* Encabezado: Nombre, Grade y botón */}
              <View style={styles.submissionHeader}>
                <Text style={styles.submissionStudentName}>
                  {submission.student_name || submission.student_id || 'fran'}
                </Text>

                <View style={styles.gradeBox}>
                  <Text style={styles.gradeText}>{submission.grade || ''}</Text>
                </View>

                <TouchableOpacity
                  style={styles.qualifyButton}
                  onPress={() => {
                    navigation.navigate('TeacherQualifyAssignment');
                  }}
                >
                  <Text style={styles.qualifyButtonText}>Qualify</Text>
                </TouchableOpacity>
              </View>

              {/* Archivos entregados */}
              {submission.files?.map((file) => (
                <TouchableOpacity
                  key={file.id ?? file.name}
                  onPress={() => handleDownloadFile(file)}
                  style={styles.fileButton}
                >
                  <Text style={styles.fileName}>📄 {file.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </>
      ) : (
        <Text style={{ marginTop: 8 }}>No submissions yet.</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assignments and Files</Text>

      <FlatList
        data={tasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id?.toString()}
        ListEmptyComponent={<Text>No tasks found.</Text>}
      />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  taskItem: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 10,
  },
  fileButton: {
    backgroundColor: '#ecf0f1',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  fileName: {
    fontSize: 14,
    color: '#2c3e50',
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: '#dcdde1',
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  submissionTitle: {
    fontWeight: '600',
    marginTop: 10,
    color: '#2c3e50',

    textAlign: 'center',
  },
  submissionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#7f8c8d',
  },
  submissionContainer: {
    marginTop: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    alignItems: 'center',
  },
  submissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  submissionStudentName: {
    fontWeight: 'bold',
    marginRight: 12,
    color: '#2c3e50',
  },
  gradeBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gradeText: {
    fontSize: 12,
    color: '#333',
  },
  qualifyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ecf0f1', // gris claro
    borderRadius: 6,
  },
  qualifyButtonText: {
    color: '#2c3e50', // gris oscuro
    fontSize: 12,
    fontWeight: '500',
  },
});

export default DownloadFilesScreen;
