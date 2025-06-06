import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import StartScreen from '../screens/StartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LocationScreen from '../screens/LocationScreen';
import PinScreen from '../screens/PinScreen';
import PasswordRecoveryScreen from '../screens/recoveryPassword/PasswordRecoveryScreen';
import RestPassword from '../screens/recoveryPassword/RestePassword';
import VerifyPin from '../screens/recoveryPassword/VerifyPin';

import StudentCoursesScreen from '../screens/student/StudentCoursesScreen';
import StudentAvailableCoursesScrenn from '../screens/student/StudentAvailableCoursesScrenn';
import StudentCourseDetail from '../screens/student/StudentCourseDetail';
import StudentFeedbackScreen from '../screens/student/StudentFeedbackScreen';
import StudentEditAssigment from '../screens/student/StudentEditAssigment';
import ShowProfileData from '../utils/ShowProfileData';
import StudentAssigmentScreen from '../screens/student/StudentAssigmentScreen';
import StudentViewFeedback from '../screens/student/StudentViewFeedback';



import TeacherCoursesScreen from '../screens/teacher/TeacherCoursesScreen';
import TeacherCreateNewCourse from '../screens/teacher/TeacherCreateNewCourse';
import TeacherCoursesDetail from '../screens/teacher/TeacherCoursesDetail';
import TeacherEditCourseDetail from '../screens/teacher/TeacherEditCourseDetail';
import TeacherCreateAssignments from '@/screens/teacher/TeacherCreateAssignment';
import TeacherFeedbackCourse from '@/screens/teacher/TeacherFeedbackCourse';
import TeacherMembersCourse from '@/screens/teacher/TeacherMemberCourse';
import TeacherEditAssigments from '@/screens/teacher/TeacherEditAssigments';
import TeacherResumeFeedbacks from '@/screens/teacher/TeacherResumeFeedbacks';
import TeacherQualifyAssignment from '@/screens/teacher/TeacherQualifyAssignment';
import TeacherFeedbackStudent from '@/screens/teacher/TeacherFeedbackStudent';
import TeacherStatistics from '@/screens/teacher/TeacherStatistics';
import StudentsSubmissions from '../screens/teacher/StudentsSubmissions';
import ShowCourseData from '../utils/ShowCourseData';
import AddModuleScreen from '../screens/teacher/resources/AddModuleScreen';
import UpdateOrder from '../screens/teacher/resources/UpdateOrder';
import AddResourceForModule from '../screens/teacher/resources/AddResourceForModule';
import EditModule from '../screens/teacher/resources/EditModule';
import StudentShowGrade from '../screens/student/StudentShowGrade';
import StudentIndividualStatistics from '@/screens/teacher/StudentIndividualStatistics';
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
    <Stack.Screen name="PinScreen" component={PinScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="PasswordRecovery" component={PasswordRecoveryScreen} />
    <Stack.Screen name="VerifyPin" component={VerifyPin} />
    <Stack.Screen name="ResetPassword" component={RestPassword} />

    <Stack.Screen name="StudentCourses" component={StudentCoursesScreen} />
    <Stack.Screen
      name="AvailableCourses"
      component={StudentAvailableCoursesScrenn}
    />
    <Stack.Screen name="StudentCourseDetail" component={StudentCourseDetail} />
    <Stack.Screen name="StudentFeedback" component={StudentFeedbackScreen} />
    <Stack.Screen
      name="StudentEditAssigment"
      component={StudentEditAssigment}
    />
    <Stack.Screen
      name="ShowProfileData"
      component={ShowProfileData}
      options={{ headerShown: true, title: 'My Profile' }}
    />
    <Stack.Screen
      name="ShowCourseData"
      component={ShowCourseData}
      options={{ headerShown: true, title: 'Course Detail' }}
    />
    <Stack.Screen
      name="StudentAssignmentScreen"
      component={StudentAssigmentScreen}
      options={{ headerShown: true, title: 'Assignment' }}
    />

    <Stack.Screen
      name="StudentViewFeedback"
      component={StudentViewFeedback}
      options={{ headerShown: true, title: 'Feedback' }}
    />

    {/* Teacher Screens */}

    <Stack.Screen name="TeacherCourses" component={TeacherCoursesScreen} />
    <Stack.Screen name="CreateNewCourse" component={TeacherCreateNewCourse} />
    <Stack.Screen name="TeacherCourseDetail" component={TeacherCoursesDetail} />
    <Stack.Screen
      name="TeacherEditCourseDetail"
      component={TeacherEditCourseDetail}
    />
    <Stack.Screen
      name="TeacherCreateAssignments"
      component={TeacherCreateAssignments}
    />
    <Stack.Screen
      name="TeacherFeedbackCourse"
      component={TeacherFeedbackCourse}
    />
    <Stack.Screen
      name="TeacherMembersCourse"
      component={TeacherMembersCourse}
    />
    <Stack.Screen name="StudentsSubmissions" component={StudentsSubmissions} />
    <Stack.Screen
      name="TeacherEditAssigments"
      component={TeacherEditAssigments}
    />
    <Stack.Screen
      name="TeacherResumeFeedbacks"
      component={TeacherResumeFeedbacks}
    />

    <Stack.Screen
      name="TeacherQualifyAssignment"
      component={TeacherQualifyAssignment}
    />

    <Stack.Screen
      name="TeacherFeedbackStudent"
      component={TeacherFeedbackStudent}
    />

    <Stack.Screen name="AddModuleScreen" component={AddModuleScreen} />
    
    <Stack.Screen
      name="AddResourceForModule"
      component={AddResourceForModule}
    />
   <Stack.Screen 
  name="UpdateOrder" 
  component={UpdateOrder}
  options={{ headerShown: false }}
/>
    <Stack.Screen name="EditModule" component={EditModule} />

    <Stack.Screen name="TeacherStatistics" component={TeacherStatistics} />

    <Stack.Screen 
  name="StudentShowGrade"  
  component={StudentShowGrade} 
/>

    <Stack.Screen 
      name="StudentIndividualStatistics" 
      component={StudentIndividualStatistics} 
 
    />

    
  </Stack.Navigator>
);

export default AuthStack;
