import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '@env';
import { downloadAndShareFile } from '../../utils/FileDowloader';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UploadFilesScreen = ({ route }) => {
  const navigation = useNavigation();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const { course, userId, assignmentId } = route.params;

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_URL}/api/courses/${course.id}/assignment/${assignmentId}/submission/${userId}`,
          { method: 'GET', headers: { Accept: 'application/json' } }
        );
        const json = await response.json();
        console.log('Fetched files:', json);

        if (json?.data?.files && Array.isArray(json.data.files)) {
          setFiles(json.data.files);
        } else {
          console.error('No files found or unexpected response format.');
        }
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [course.id, assignmentId, userId]);

  const handleCancel = () => navigation.goBack();
  const handleSend = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token found');
  
      const result = await DocumentPicker.getDocumentAsync({ multiple: true });
  
      if (result.canceled) return;
  
      const newFiles = await Promise.all(
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
  
      const body = {
        course_id: Number(course.id),
        assignment_id: Number(assignmentId),
        content: 'Updated submission',
        files: newFiles,
      };
  
      const response = await fetch(
        `${API_URL}/api/courses/${course.id}/assignment/${assignmentId}/submission/${userId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );
  
      if (!response.ok) throw new Error('Failed to submit files');
  
      alert('Files uploaded successfully!');
      setFiles((prev) => [...prev, ...newFiles.map(f => ({ name: f.name }))]); // para mostrar en lista
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload files!');
    }
  };
  const handleDownloadFile = async (file) => {
    try {
      await downloadAndShareFile(file);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };
  const handleRemoveFile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token found');
  
      const response = await fetch(
        `${API_URL}/api/courses/${course.id}/assignment/${assignmentId}/submission/${userId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (!response.ok) throw new Error('Failed to delete file');
  
     
  
      alert(`File deleted successfully!`);
    } catch (error) {
      console.error('Error deleting file:', error);
      alert(`Failed to delete `);
    }
  };
  

  const renderFileItem = ({ item }) => (
    <View style={styles.fileItem}>
      <TouchableOpacity style={styles.fileContainer} onPress={() => handleDownloadFile(item)}>
        <Text style={styles.fileName}>{item.name}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveFile()}>
        <Text style={styles.removeButtonText}>X</Text>
      </TouchableOpacity>
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
      <Text style={styles.title}>Upload Files</Text>

      <FlatList
        data={files}
        renderItem={renderFileItem}
        keyExtractor={(item) => item.id?.toString() ?? item.name}
        style={styles.filesContainer}
        ListEmptyComponent={<Text>No files found</Text>}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.buttonText}>Add new files</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
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
  filesContainer: {
    flexGrow: 1,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  fileContainer: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#34495e',
  },
  removeButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: 12,
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
  },
  sendButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default UploadFilesScreen;
