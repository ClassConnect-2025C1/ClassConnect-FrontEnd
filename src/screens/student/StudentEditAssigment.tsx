import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '@env';
import { downloadAndShareFile } from '../../utils/FileDowloader';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StatusOverlay from '../../components/StatusOverlay';
import { AcceptOnlyModal } from '../../components/Modals';
import { useAuth } from '../../navigation/AuthContext'; // Import the AuthContext

const UploadFilesScreen = ({ route }) => {
  const navigation = useNavigation();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const { course, userId, assignmentId } = route.params;

  const [showNoFilesToDeleteModal, setShowNoFilesToDeleteModal] =
    useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noFilesFound, setNoFilesFound] = useState(false);
  const { token } = useAuth();

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setNoFilesFound(false);
    try {
      const response = await fetch(
        `${API_URL}/api/courses/${course.id}/assignment/${assignmentId}/submission/${userId}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const json = await response.json();
      console.log('Fetched files:', json);

      if (json?.data?.files && Array.isArray(json.data.files)) {
        setFiles(json.data.files);
        if (json.data.files.length === 0) {
          setNoFilesFound(true);
        }
      } else {
        setNoFilesFound(true);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      setNoFilesFound(true);
    } finally {
      setLoading(false);
    }
  }, [course.id, assignmentId, userId, token]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleCancel = () => navigation.goBack();

  const handleSend = async () => {
    try {
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
        }),
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
        },
      );

      if (!response.ok) throw new Error('Failed to submit files');

      setIsUploading(true);
      setUploadSuccess(false);

      setTimeout(() => {
        setUploadSuccess(true);

        setTimeout(() => {
          setIsUploading(false);
          setUploadSuccess(false);
          navigation.goBack();
        }, 2000);
      }, 1500);
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

  const handleRemoveAllFiles = async () => {
    try {
      if (files.length === 0) {
        setShowNoFilesToDeleteModal(true);
        return;
      }

      if (!token) throw new Error('No token found');

      const response = await fetch(
        `${API_URL}/api/courses/${course.id}/assignment/${assignmentId}/submission/${userId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error('Failed to delete files');

      setShowDeleteModal(true);
      await fetchFiles();

      setTimeout(() => {
        setShowDeleteModal(false);
        navigation.goBack();
      }, 3000);
    } catch (error) {
      console.error('Error deleting files:', error);
    }
  };

  const renderFileItem = ({ item }) => (
    <View style={styles.fileItem}>
      <TouchableOpacity
        style={styles.fileContainer}
        onPress={() => handleDownloadFile(item)}
      >
        <Text style={styles.fileName}>{item.name}</Text>
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

  return isUploading ? (
    <StatusOverlay
      loading={!uploadSuccess}
      success={uploadSuccess}
      loadingMsg="Uploading files..."
      successMsg="Files uploaded successfully!"
    />
  ) : (
    <View style={styles.container}>
      <AcceptOnlyModal
        visible={showDeleteModal}
        message="Files deleted successfully!"
        onAccept={() => setShowDeleteModal(false)}
        onClose={() => setShowDeleteModal(false)}
      />

      <AcceptOnlyModal
        visible={showNoFilesToDeleteModal}
        message="There are no files to delete."
        onAccept={() => setShowNoFilesToDeleteModal(false)}
        onClose={() => setShowNoFilesToDeleteModal(false)}
      />
      <Text style={styles.title}>Upload Files</Text>

      <FlatList
        data={files}
        renderItem={renderFileItem}
        keyExtractor={(item) => item.id?.toString() ?? item.name}
        style={styles.filesContainer}
        ListEmptyComponent={<Text>No archives uploaded</Text>}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.buttonText}>Add files</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleRemoveAllFiles}
        >
          <Text style={styles.buttonText}>Delete files</Text>
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Changed from space-around to space-between
    marginTop: 30,
    marginBottom: 20, // Added marginBottom to add space below the buttons
  },
  sendButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
    elevation: 3,
    flex: 1, // Make buttons take up equal space
    marginRight: 10, // Added margin between buttons
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
    elevation: 3,
    flex: 1,
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
    elevation: 3,
    flex: 1,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default UploadFilesScreen;
