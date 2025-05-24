import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';

const TeacherQualifyAssignment = () => {
  const [comment, setComment] = useState('');
  const [grade, setGrade] = useState('');
  const navigation = useNavigation();

  const handleSubmit = () => {
    console.log('Submitted comment:', comment);
    console.log('Submitted grade:', grade);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Submission From Student</Text>

      <Text style={styles.label}>Comment</Text>
      <TextInput
        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
        multiline
        placeholder="Enter your comment"
        value={comment}
        onChangeText={setComment}
      />

      <Text style={styles.label}>Grade</Text>
      <TextInput
        style={[styles.input, { width: 80 }]}
        placeholder="e.g. 10"
        value={grade}
        onChangeText={setGrade}
        keyboardType="numeric"
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.createButton} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit Grade</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
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

export default TeacherQualifyAssignment;
