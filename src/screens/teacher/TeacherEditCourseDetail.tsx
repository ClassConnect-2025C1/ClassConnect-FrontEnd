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
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { validateFields } from '../../Errors/ValidationsEditCourse';
import { API_URL } from '@env';
import MultiSelect from 'react-native-multiple-select';
import { useAuth } from '../../navigation/AuthContext';

const { width } = Dimensions.get('window');

export default function EditCourseScreen({ route }) {
  const { course } = route.params;

  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [startDate, setStartDate] = useState(course.startDate);
  const [endDate, setEndDate] = useState(course.endDate);
  const { token } = useAuth();


  const [eligibilityOptions, setEligibilityOptions] = useState([]);
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>(course.eligibilityCriteria || []);

  const [errors, setErrors] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  const navigation = useNavigation();

  useEffect(() => {
    const fetchEligibilityOptions = async () => {
      try {
        const response = await fetch(`${API_URL}/api/courses/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await response.json();
        const coursesArray = Array.isArray(json.data) ? json.data : [];
  
    
        const uniqueCoursesMap = new Map();
  
        for (const course of coursesArray) {
          if (!uniqueCoursesMap.has(course.title)) {
            uniqueCoursesMap.set(course.title, course);
          }
        }
  
     
        const options = Array.from(uniqueCoursesMap.values())
          .filter((c) => c.title !== course.title) 
          .map((course: any) => ({
            id: course.title, 
            name: course.title,
          }));
  
        setEligibilityOptions(options);
      } catch (error) {
        console.error('Error fetching eligibility options:', error);
      }
    };
  
    fetchEligibilityOptions();
  }, []);

  const handleSaveChanges = async () => {


 
    const newErrors = validateFields(
      title,
      description,
      selectedCriteria,
      startDate,
      endDate,
    );
    setErrors(newErrors);
    console.log('Errors:', newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }
    const filteredCriteria = selectedCriteria.filter((criteria) => criteria.trim() !== '');

    try {
      if (!token) throw new Error('No token found');
      const formattedStartDate = `${startDate}T00:00:00Z`;
      const formattedEndDate = `${endDate}T00:00:00Z`;

      const response = await fetch(`${API_URL}/api/courses/${course.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          eligibility_criteria: filteredCriteria,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error updating course:', errorData);
        return;
      }

      let updatedCourse = null;
      const contentLength = response.headers.get('content-length');

      if (contentLength && parseInt(contentLength) > 0) {
        updatedCourse = await response.json();
      }

      navigation.navigate('TeacherCourses', { updatedCourse });
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  const handleRemoveCriteria = (criteria: string) => {
    setSelectedCriteria((prev) => prev.filter((item) => item !== criteria));
  };
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Edit Course</Text>
  
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 10 }}>
          {/* Title */}
          <TextInput
            style={styles.input}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
  
          {/* Description */}
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
          />
          {errors.description && (
            <Text style={styles.errorText}>{errors.description}</Text>
          )}
  
          {/* Eligibility Criteria */}
          <Text style={{ marginBottom: 6 }}>Eligibility Criteria</Text>
          <View style={{ maxHeight: 200, marginBottom: 16 }}>
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
            />
          </View>
  
          {/* Selected Criteria */}
          {selectedCriteria.filter((criteria) => criteria.trim() !== '').length === 0 && (
  <Text style={styles.noCriteriaText}>
    This course does not contain eligibility criteria.
  </Text>
)}
  
          {/* Start Date */}
          <TextInput
            style={styles.input}
            placeholder="Start Date (YYYY-MM-DD)"
            value={startDate}
            onChangeText={setStartDate}
          />
          {errors.startDate && (
            <Text style={styles.errorText}>{errors.startDate}</Text>
          )}
  
          {/* End Date */}
          <TextInput
            style={styles.input}
            placeholder="End Date (YYYY-MM-DD)"
            value={endDate}
            onChangeText={setEndDate}
          />
          {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
  
          {/* Save Button */}
          <TouchableOpacity style={styles.button} onPress={handleSaveChanges}>
            <Text style={styles.buttonText}>Save Changes</Text>
          </TouchableOpacity>
  
          {/* Back Button */}
          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    alignSelf: 'center',        
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
    alignSelf: 'center',
    marginRight: 23,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  subHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  criteriaText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  criteriaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2', // Fondo suave para cada criterio
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    justifyContent: 'space-between',
  },

  removeButton: {
    backgroundColor: '#E74C3C', // Rojo para la cruz
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  noCriteriaText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 16,
  },
});
