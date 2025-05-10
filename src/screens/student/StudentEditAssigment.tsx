import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { downloadAndShareFile } from '../../utils/FileDowloader';

export default function StudentEditSubmission({ route }) {
  const { courseId, assignmentId, userId } = route.params;
  const navigation = useNavigation();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newFiles, setNewFiles] = useState([]);

  useEffect(() => {
    fetchSubmission();
  }, []);

  const fetchSubmission = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(
        `${API_URL}/api/courses/${courseId}/assignment/${assignmentId}/submission/${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch submission');
      const data = await response.json();
      if (data.data.files) {
        setFiles(data.data.files);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileDelete = (fileName) => {
    Alert.alert('Delete File', `Are you sure you want to delete ${fileName}?`, [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: () => {
          setFiles(files.filter((file) => file.name !== fileName));
        },
      },
    ]);
  };

  const handleSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const body = {
        course_id: Number(courseId),
        assignment_id: Number(assignmentId),
        user_id: userId,
        files: [...files, ...newFiles],
      };

      const response = await fetch(
        `${API_URL}/api/courses/${courseId}/assignment/${assignmentId}/submission/${userId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) throw new Error('Failed to submit the updated assignment');
      alert('Submission updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      alert('Submission update failed!');
    }
  };

  const handleFileUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({ multiple: true });
    if (result.canceled) return;

    const newFilesData = await Promise.all(
      result.assets.map(async (file) => {
        const fileContent = await fetch(file.uri);
        const contentBlob = await fileContent.blob();
        const base64Content = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(contentBlob);
        });

        return {
          name: file.name,
          content: base64Content.split(',')[1],
          size: Number(file.size),
        };
      })
    );
    setNewFiles(newFilesData);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Submission</Text>

      {loading ? (
        <Text>Loading your previous submission...</Text>
      ) : (
        <>
          <FlatList
            data={files}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.fileContainer}>
                <Text style={styles.fileName}>{item.name}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleFileDelete(item.name)}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text>No files attached yet.</Text>}
          />

          <TouchableOpacity style={styles.uploadButton} onPress={handleFileUpload}>
            <Text style={styles.uploadText}>Upload New Files</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>Update Submission</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  fileContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  fileName: {
    fontSize: 16,
    color: '#333',
  },
  deleteButton: {
    backgroundColor: 'red',
    padding: 5,
    borderRadius: 5,
  },
  deleteText: {
    color: '#fff',
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    alignItems: 'center',
  },
  uploadText: {
    color: '#fff',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
  },
});
