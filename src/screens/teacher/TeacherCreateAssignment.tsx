import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker'; 
import StatusOverlay from '../../components/StatusOverlay';
import { AcceptOnlyModal } from '../../components/Modals';

const TeacherCreateAssignments = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { course } = route.params;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [files, setFiles] = useState([]); 

  const [isLoading, setIsLoading] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false); 

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const handleSelectFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
  
      if (!result.canceled && result.assets?.length > 0) {
        const selectedFile = result.assets[0]; // solo uno porque multiple: false
  
        setFiles((prevFiles) => [...prevFiles, selectedFile]);
  
        console.log('File selected:', selectedFile);
      } else {
        console.log('User cancelled file picker');
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };
  
  const handleRemoveFile = (fileUri) => {
    setFiles(files.filter((file) => file.uri !== fileUri)); 
  };

  const handleCreateAssignment = async () => {
    if (!title || !description || !dueDate || !timeLimit ) {
      setModalMessage('All fields must be filled.');
      setShowModal(true);
      return;
    }

    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(dueDate);
    if (!isValidDate) {
      setModalMessage('Invalid date format. Use YYYY-MM-DD.');
      setShowModal(true);
      return;
    }

    const parsedDate = new Date(`${dueDate}T23:59:59Z`);
    if (isNaN(parsedDate.getTime())) {
      setModalMessage('Invalid date. Please check the value.');
      setShowModal(true);
      return;
    }

    const isoDueDate = parsedDate.toISOString();

    const fileContents = await Promise.all(
      files.map(async (file) => {
        const fileContent = await fetch(file.uri);  // Fetch the file from the URI
        const contentBlob = await fileContent.blob();  // Convert to blob
        const base64Content = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(contentBlob);
        });

        return {
          name: file.name,
          content: base64Content.split(',')[1],  // Extract the base64 string without the prefix
          size: file.size,
        };
      })
    );

    try {
      setIsLoading(true);  // Start loading

      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(`http://192.168.100.208:8002/${course.id}/assignment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          course_id: Number(course.id),
          title,
          description,
          deadline: isoDueDate,
          time_limit: Number(timeLimit),
          files: fileContents,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error creating assignment:', errorData);
        setModalMessage('Failed to create assignment. Please try again.');
        setShowModal(true);
        setIsLoading(false); 
        return;
      }

      setTimeout(() => {
        setFeedbackSent(true);
        setTimeout(() => {
          setIsLoading(false); 
          setFeedbackSent(false);
          navigation.goBack();
        }, 2000);
      }, 1500);

    } catch (error) {
      console.error('Error:', error);
      setModalMessage('An error occurred. Please try again.');
      setShowModal(true);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <StatusOverlay
          loading={!feedbackSent}
          success={feedbackSent}
          loadingMsg="Creating assignment..."
          successMsg="Assignment created successfully!"
        />
      ) : (
        <>
          <Text style={styles.title}>Create Assignment</Text>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Assignment Title"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Assignment Description"
          />

          <Text style={styles.label}>Due Date</Text>
          <TextInput
            style={styles.input}
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="Due Date (YYYY-MM-DD)"
          />

          <Text style={styles.label}>Time Limit</Text>
          <TextInput
            style={styles.input}
            value={timeLimit}
            onChangeText={setTimeLimit}
            placeholder="Time Limit (in minutes)"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Files</Text>

          {/* Display selected files */}
          <View style={styles.filesContainer}>
            {files.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <Text style={styles.fileName}>{file.name}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveFile(file.uri)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>X</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.addFileButton, files.length > 0 && { backgroundColor: '#ddd' }]}
            onPress={handleSelectFiles}
          >
            <Text style={styles.buttonText}>{files.length === 0 ? 'Add Files' : 'Add More Files'}</Text>
          </TouchableOpacity>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateAssignment}
            >
              <Text style={styles.buttonText}>Create</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <AcceptOnlyModal
            visible={showModal}
            message={modalMessage}
            onAccept={() => setShowModal(false)}
            onClose={() => setShowModal(false)}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    alignSelf: 'center',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    marginTop: 20, 
  },
  label: {
    fontSize: 14,
    marginTop: 10,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 10,
  },
  addFileButton: {
    backgroundColor: '#eee',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  filesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  fileItem: {
    backgroundColor: '#ddd',
    padding: 8,
    margin: 5,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileName: {
    fontSize: 12,
    color: '#333',
    marginRight: 5,
  },
  removeButton: {
    backgroundColor: '#ff4d4d',
    borderRadius: 50,
    padding: 5,
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  createButton: {
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 10,
    flex: 0.48,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#555',
    padding: 14,
    borderRadius: 10,
    flex: 0.48,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default TeacherCreateAssignments;
