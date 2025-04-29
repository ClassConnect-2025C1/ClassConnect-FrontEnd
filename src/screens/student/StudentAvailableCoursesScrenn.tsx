import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getUserProfileData } from '../../utils/GetUserProfile';

const AvailableCoursesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { courses = [] } = route.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Courses</Text>
      <ScrollView contentContainerStyle={styles.courseList}>
        {courses.map((course) => (
          <View key={course.id} style={styles.courseCard}>
            <Text style={styles.courseText}>{course.title}</Text>
            <TouchableOpacity
              style={styles.enrollButton}
              onPress={async () => {
                const user = await getUserProfileData();

                if (!user) {
                  alert('Could not get user info.');
                  return;
                }

                try {
                  const response = await fetch(
                    `http://192.168.0.12:8002/${course.id}/enroll`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        user_id: user.userId,
                        email: user.email,
                        name: user.name + ' ' + user.lastName,
                      }),
                    },
                  );

                  if (!response.ok) {
                    throw new Error('Enrollment failed');
                  }

                  navigation.goBack();
                } catch (error) {
                  console.error(error);
                  alert('Failed to enroll in course.');
                }
              }}
            >
              <Text style={styles.enrollButtonText}>Enroll</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AvailableCoursesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'center',
  },
  courseList: {
    paddingBottom: 20,
  },
  courseCard: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseText: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
  enrollButton: {
    borderColor: '#BDBDBD',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#E0E0E0',
  },
  enrollButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
  },

  doneButton: {
    backgroundColor: '#aaa',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
