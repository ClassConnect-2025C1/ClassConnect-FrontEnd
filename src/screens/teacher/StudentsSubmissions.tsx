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
  const { course } = route.params;
  const navigation = useNavigation();
  const { token } = useAuth();

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/courses/${course.id}/assignments`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const json = await response.json();

      if (Array.isArray(json?.data)) {
        setTasks(json.data);
      } else {
        console.error('Unexpected response format:', json);
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
});

export default DownloadFilesScreen;
