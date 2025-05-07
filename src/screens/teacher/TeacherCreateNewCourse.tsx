import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { AcceptOnlyModal } from '../../components/Modals';
import { getUserProfileData } from '../../utils/GetUserProfile';
import { API_URL } from '@env';
import MultiSelect from 'react-native-multiple-select';
import StatusOverlay from '../../components/StatusOverlay'; // Importamos el StatusOverlay

const TeacherCreateNewCourseScreen = () => {
  const navigation = useNavigation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [eligibilityOptions, setEligibilityOptions] = useState([]);
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);  // Estado para controlar la carga
  const [feedbackSent, setFeedbackSent] = useState(false); // Estado para saber si el feedback fue enviado correctamente

  useEffect(() => {
    const fetchInitialData = async () => {
      const teacher = await getUserProfileData();
      if (teacher?.email) {
        setTeacherEmail(teacher.email);
      }

      try {
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/courses/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await response.json();
        const coursesArray = Array.isArray(json.data) ? json.data : [];

        const options = coursesArray.map((course: any) => ({
          id: course.title,
          name: course.title,
        }));
        setEligibilityOptions(options);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setModalMessage('Could not load eligibility criteria.');
        setShowModal(true);
      }
    };

    fetchInitialData();
  }, []);

  const handleCreateCourse = async () => {
    if (!title || !description || !capacity) {
      setModalMessage('All fields must be filled.');
      setShowModal(true);
      return;
    }

    const capacityNumber = parseInt(capacity, 10);
    if (isNaN(capacityNumber) || capacityNumber <= 0) {
      setModalMessage('Capacity must be a valid number greater than zero.');
      setShowModal(true);
      return;
    }

    try {
      setIsLoading(true);  // Establece isLoading a true cuando se empieza a crear el curso

      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(`${API_URL}/api/courses/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          eligibility_criteria: selectedCriteria,
          capacity: capacityNumber,
          created_by: teacherEmail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error creating course:', errorData);
        setIsLoading(false);  // Desactiva la carga si hay un error
        setModalMessage('Failed to create course. Please try again.');
        setShowModal(true);
        return;
      }

      const data = await response.json();
      setFeedbackSent(true);  
      setIsLoading(false);  

      setTimeout(() => {
        setFeedbackSent(true);
      
        setTimeout(() => {
          setIsLoading(false); 
          setFeedbackSent(false);
          
          navigation.navigate('TeacherCourses', { newCourse: data });
        }, 2000);
      
      }, 1500);
    } catch (error) {
      setIsLoading(false);  
      setModalMessage('An unexpected error occurred.');
      setShowModal(true);
    }
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <StatusOverlay
          loading={!feedbackSent}
          success={feedbackSent}
          loadingMsg="Creating course..."
          successMsg="Course created successfully!"
        />
      ) : (
        <>
          <Text style={styles.title}>Create New Course</Text>

          <Text style={styles.label}>Course Name</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.description]}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Text style={styles.label}>Eligibility Criteria</Text>
          <MultiSelect
            items={eligibilityOptions}
            uniqueKey="id"
            onSelectedItemsChange={setSelectedCriteria}
            selectedItems={selectedCriteria}
            selectText="Select criteria"
            searchInputPlaceholderText="Search criteria..."
            tagRemoveIconColor="#333"
            tagBorderColor="#333"
            tagTextColor="#333"
            selectedItemTextColor="#333"
            selectedItemIconColor="#333"
            itemTextColor="#000"
            displayKey="name"
            searchInputStyle={{ color: '#333' }}
            submitButtonColor="#333"
            submitButtonText="Confirm"
            styleMainWrapper={styles.multiSelect}
          />

          <Text style={styles.label}>Capacity</Text>
          <TextInput
            style={styles.input}
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="numeric"
          />

          <AcceptOnlyModal
            visible={showModal}
            message={modalMessage}
            onAccept={() => setShowModal(false)}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateCourse}>
              <Text style={styles.buttonText}>Create</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 40,
    backgroundColor: '#fff',
  },
  title: {
    alignSelf: 'center',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
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
  description: {
    height: 100,
    textAlignVertical: 'top',
  },
  multiSelect: {
    marginTop: 10,
    marginBottom: 20,
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
    color: 'white',
    fontWeight: 'bold',
  },
});

export default TeacherCreateNewCourseScreen;
