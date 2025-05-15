import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '@env';
import { useAuth } from '../../navigation/AuthContext';
import * as DocumentPicker from 'expo-document-picker';
import { Linking } from 'react-native';
import StatusOverlay from '../../components/StatusOverlay';

const { width } = Dimensions.get('window');

const convertToBase64 = async (uri) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]); // Elimina el prefijo de base64
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export default function TeacherEditAssignments({ route }) {
  const { assignment, course } = route.params;
  const navigation = useNavigation();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [saveChangueConfirmed, setChangueConfirmed] = useState(false);

  const [errors, setErrors] = useState({});

  const [title, setTitle] = useState(assignment.title);
  const [description, setDescription] = useState(assignment.description);
  const [deadline, setDeadline] = useState(assignment.deadline.split('T')[0]);
  const [timeLimit, setTimeLimit] = useState(String(assignment.time_limit));
  const [error, setError] = useState('');
  const [existingFiles, setExistingFiles] = useState(assignment.files || []);
  const [newFiles, setNewFiles] = useState([]);
  const [deletedExistingFileIds, setDeletedExistingFileIds] = useState([]);

  useEffect(() => {
    const fetchAssignment = async () => {
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

        const data = await response.json();

        const assignmentData = data.data;
        setTitle(assignmentData.title);
        setDescription(assignmentData.description);
        setDeadline(assignmentData.deadline.split('T')[0]);
        setTimeLimit(String(assignmentData.time_limit));
        setExistingFiles(assignmentData.files || []);
      } catch (error) {
        console.error('Error fetching specific assignment:', error);
      }
    };

    fetchAssignment();
  }, []);

  const handleRemoveFile = (fileToRemove) => {
    setExistingFiles((prev) =>
      prev.filter((file) => file.id !== fileToRemove.id),
    );
    setDeletedExistingFileIds((prev) => [...prev, fileToRemove.id]);
  };

  const handleSaveChanges = async () => {
    const newErrors = {};
    if (!title) newErrors.title = 'Title is required';
    if (!description) newErrors.description = 'Description is required';
    if (!deadline) newErrors.deadline = 'Deadline is required';


    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    const filesToSend = await Promise.all(
      newFiles
        .filter((file) => !file.deleted) 
        .map(async (file) => ({
          name: file.name,
          content: await convertToBase64(file.uri), 
          size: file.size,
        })),
    );

    const timeLimitInt = parseInt(timeLimit, 10);

    const formData = {
      title,
      description,
      deadline: `${deadline}T00:00:00Z`,
      time_limit: timeLimitInt,
      files: filesToSend,
    };

    try {
      const response = await fetch(
        `${API_URL}/api/courses/${course.id}/assignment/${assignment.id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        },
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error updating assignment:', errorData);
        return;
      }

      setTimeout(() => {
        setChangueConfirmed(true);

        setTimeout(() => {
          setIsLoading(false);
          setChangueConfirmed(false);
          navigation.navigate('TeacherCourses');
        }, 1500);
      }, 1000);
    } catch (err) {
      console.error('Network error:', err);
    }
  };
  return isLoading ? (
    <StatusOverlay
      loading={!saveChangueConfirmed}
      success={saveChangueConfirmed}
      loadingMsg="Changing assignment..."
      successMsg="Assignment changed successfully!"
    />
  ) : (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Edit Assignment</Text>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter title"
          value={title}
          onChangeText={setTitle}
        />
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter description"
          value={description}
          onChangeText={setDescription}
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

        <Text style={styles.label}>Deadline</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={deadline}
          onChangeText={setDeadline}
        />
        {errors.deadline && <Text style={styles.errorText}>{errors.deadline}</Text>}

        <Text style={styles.label}>Time Limit (in minutes)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 30"
          keyboardType="numeric"
          value={timeLimit}
          onChangeText={setTimeLimit}
        />


        <Text style={styles.label}>Current Files</Text>
        <View style={styles.fileContainer}>
          {existingFiles.map((file, index) => (
            <View key={index} style={styles.fileItem}>
              <TouchableOpacity
                onPress={() => {
                  Linking.openURL(file.url);
                }}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.fileName, { color: 'blue' }]}
                >
                  {file.name}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeFileButton}
                onPress={() => handleRemoveFile(file)}
              >
                <Text style={styles.removeFileText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={async () => {
            const result = await DocumentPicker.getDocumentAsync({
              type: '*/*',
            });
            if (!result.canceled) {
              setNewFiles((prev) => [...prev, result.assets[0]]);
            }
          }}
        >
          <Text style={styles.uploadButtonText}>Upload New File</Text>
        </TouchableOpacity>

        {newFiles.map((file, index) => (
          <Text key={index} style={styles.newFileItem}>
            {file.name}
          </Text>
        ))}


        <TouchableOpacity style={styles.button} onPress={handleSaveChanges}>
          <Text style={styles.buttonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f7',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    marginBottom: 20,
    fontSize: 16,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 25,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 20,
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  backButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
    color: '#333',
  },
  fileContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d0e8ff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  fileName: {
    maxWidth: 100,
    marginRight: 8,
  },
  removeFileButton: {
    backgroundColor: '#ff4d4f',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  removeFileText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  uploadButton: {
    backgroundColor: '#1976D2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  uploadButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  newFileItem: {
    fontSize: 14,
    marginBottom: 5,
  },
});
