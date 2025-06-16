import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { API_URL } from '@env';
import StatusOverlay from '../../../components/StatusOverlay';

const AddResourceForModule = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { token, course, module } = route.params;

  const [link, setLink] = useState('');

  // Estados para el StatusOverlay
  const [isLoading, setIsLoading] = useState(false);
  const [operationSuccess, setOperationSuccess] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-return después del éxito
  useEffect(() => {
    if (operationSuccess) {
      const timer = setTimeout(() => {
        navigation.goBack();
      }, 2000); // Regresa después de 2 segundos

      return () => clearTimeout(timer);
    }
  }, [operationSuccess, navigation]);

  const uploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });

      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      const fileName = file.name;
      const fileUri = file.uri;
      const mimeType = file.mimeType || 'application/octet-stream';

      // Iniciar loading
      setIsLoading(true);
      setLoadingMessage('Uploading file...');
      setOperationSuccess(false);

      const formData = new FormData();

      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: mimeType,
      } as any);

      console.log('formData.get("file")', formData.get('file'));

      const response = await fetch(
        `${API_URL}/api/courses/${course.id}/resource/module/${module.module_id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const responseBody = await response.text();

      if (!response.ok) {
        console.error('Error response from server:', responseBody);
        throw new Error(
          `File upload failed: ${response.status} - ${responseBody}`,
        );
      }

      // Éxito
      setIsLoading(false);
      setOperationSuccess(true);
      setSuccessMessage('File uploaded successfully!');
    } catch (error) {
      console.error('File upload error:', error);
      setIsLoading(false);
      setOperationSuccess(false);
      Alert.alert('Error', 'Failed to upload file'); // Mantenemos Alert solo para errores
    }
  };

  const uploadLink = async () => {
    const trimmed = link.trim();
    if (!/^https?:\/\/\S+$/.test(trimmed)) {
      Alert.alert('Invalid link', 'Please enter a valid URL');
      return;
    }

    try {
      // Iniciar loading
      setIsLoading(true);
      setLoadingMessage('Adding link...');
      setOperationSuccess(false);

      const formData = new FormData();
      formData.append('link', trimmed);

      const response = await fetch(
        `${API_URL}/api/courses/${course.id}/resource/module/${module.module_id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!response.ok) throw new Error('Link upload failed');

      // Éxito
      setIsLoading(false);
      setOperationSuccess(true);
      setSuccessMessage('Link added successfully!');
    } catch (error) {
      console.error('Link upload error:', error);
      setIsLoading(false);
      setOperationSuccess(false);
      Alert.alert('Error', 'Failed to add link'); // Mantenemos Alert solo para errores
    }
  };

  // Mostrar overlay si está loading o fue exitoso
  if (isLoading || operationSuccess) {
    return (
      <StatusOverlay
        loading={isLoading}
        success={operationSuccess}
        loadingMsg={loadingMessage}
        successMsg={successMessage}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Resource to Module</Text>

      <TouchableOpacity style={styles.sendButton} onPress={uploadFile}>
        <Text style={styles.buttonText}>Add File</Text>
      </TouchableOpacity>

      <View style={{ marginVertical: 20 }}>
        <Text style={styles.label}>Add a Link</Text>
        <TextInput
          style={styles.input}
          value={link}
          onChangeText={setLink}
          placeholder="https://example.com/resource"
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity style={styles.sendButton} onPress={uploadLink}>
          <Text style={styles.buttonText}>Add Link</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AddResourceForModule;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    alignSelf: 'center',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  sendButton: {
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#555',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
