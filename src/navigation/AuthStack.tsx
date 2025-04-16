import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import StartScreen from '../screens/StartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LocationScreen from '../screens/LocationScreen';

import StudentCoursesScreen from '../screens/student/StudentCoursesScreen';
import StudentAvailableCoursesScrenn from '../screens/student/StudentAvailableCoursesScrenn';
import StudentCourseDetail from '../screens/student/StudentCourseDetail';

import TeacherCoursesScreen from '../screens/teacher/TeacherCoursesScreen';
import TeacherCreateNewCourse from '../screens/teacher/TeacherCreateNewCourse';
import TeacherCoursesDetail from '../screens/teacher/TeacherCoursesDetail';
import TeacherEditCourseDetail from '../screens/teacher/TeacherEditCourseDetail';

const Stack = createNativeStackNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name="Start"
      component={StartScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="Location" component={LocationScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />

    <Stack.Screen name="StudentCourses" component={StudentCoursesScreen} />
    <Stack.Screen
      name="AvailableCourses"
      component={StudentAvailableCoursesScrenn}
    />
    <Stack.Screen name="StudentCourseDetail" component={StudentCourseDetail} />

    <Stack.Screen name="TeacherCourses" component={TeacherCoursesScreen} />
    <Stack.Screen name="CreateNewCourse" component={TeacherCreateNewCourse} />
    <Stack.Screen name="TeacherCourseDetail" component={TeacherCoursesDetail} />
    <Stack.Screen
      name="TeacherEditCourseDetail"
      component={TeacherEditCourseDetail}
    />
  </Stack.Navigator>
);

export default AuthStack;
