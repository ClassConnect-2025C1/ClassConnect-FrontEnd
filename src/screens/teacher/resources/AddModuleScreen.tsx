import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { API_URL } from '@env';
import StatusOverlay from '../../../components/StatusOverlay';

const AddModuleScreen = () => {
  const [moduleName, setModuleName] = useState('');
  const [error, setError] = useState('');
  const navigation = useNavigation();
  const route = useRoute();
  const { token, course } = route.params;

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

  const handleCreate = async () => {
    const trimmedName = moduleName.trim();

    if (!/[a-zA-Z]/.test(trimmedName)) {
      setError('This field must be filled');
      return;
    }

    try {
      setError('');

      // Iniciar loading
      setIsLoading(true);
      setLoadingMessage('Creating module...');
      setOperationSuccess(false);

      const formData = new FormData();
      formData.append('name', trimmedName);

      const response = await fetch(
        `${API_URL}/api/courses/${course.id}/resource/module`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error('Failed to add module');
      }

      // Éxito
      setIsLoading(false);
      setOperationSuccess(true);
      setSuccessMessage('Module created successfully!');
    } catch (error) {
      console.error('Error adding module:', error);
      setIsLoading(false);
      setOperationSuccess(false);
      Alert.alert('Error', 'Failed to create module'); // Mantenemos Alert solo para errores
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
      <Text style={styles.title}>Add New Module</Text>

      <Text style={styles.label}>Module Name</Text>
      <TextInput
        style={styles.input}
        value={moduleName}
        onChangeText={setModuleName}
        placeholder="Enter module name"
        placeholderTextColor="#aaa"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.sendButton} onPress={handleCreate}>
          <Text style={styles.buttonText}>Create</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AddModuleScreen;

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
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  sendButton: {
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
    color: 'white',
    fontWeight: 'bold',
  },
});
