import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import StatusOverlay from '../../../components/StatusOverlay';
import { API_URL } from '@env';
import { useNavigation } from '@react-navigation/native';

const EditModule = ({ route }) => {
  const navigation = useNavigation();
  const { module, token, course } = route.params;
  const [name, setName] = useState(module.title);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saveChangueConfirmed, setSaveChangueConfirmed] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre del módulo no puede estar vacío');
      return;
    }

    setIsLoading(true);
    setSaveChangueConfirmed(false);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());

      const response = await fetch(
        `${API_URL}/api/courses/${course.course_id}/resource/module/${module.module_id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        setSaveChangueConfirmed(true);
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        setIsLoading(false);
        Alert.alert('Error', 'No se pudo actualizar el módulo');
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Error updating module:', error);
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return isLoading ? (
    <StatusOverlay
      loading={!saveChangueConfirmed}
      success={saveChangueConfirmed}
      loadingMsg="Updating module..."
      successMsg="Module updated successfully!"
    />
  ) : (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Module</Text>
      
      <Text style={styles.label}>Module Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter module name"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Enter module description (optional)"
        multiline={true}
        numberOfLines={3}
      />

      <TouchableOpacity style={styles.sendButton} onPress={handleSave}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

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

export default EditModule;