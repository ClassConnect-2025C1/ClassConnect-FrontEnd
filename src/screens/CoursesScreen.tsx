import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';

const CoursesScreen = () => {
  const navigation = useNavigation();

  const courses = [
    { id: 1, name: 'Math', color: '#2E86DE' },
    { id: 2, name: 'Science', color: '#45A29E' },
    { id: 3, name: 'History', color: '#F39C12' },
    { id: 4, name: 'Art', color: '#E74C3C' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.headerTitle}>ClassConnect</Text>
        <Image
          source={require('../../assets/images/profile/profile-icon.jpg')}
          style={styles.profileIcon}
        />
      </View>

      {/* Courses */}
      <ScrollView contentContainerStyle={styles.courseList}>
        {courses.map((course) => (
          <TouchableOpacity
            key={course.id}
            style={[styles.courseCard, { backgroundColor: course.color }]}
            onPress={() => console.log(`Pressed ${course.name}`)}
          >
            <Text style={styles.courseText}>{course.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },
  logo: {
    width: 35,
    height: 35,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileIcon: {
    width: 28,
    height: 28,
  },
  courseList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  courseCard: {
    height: 80,
    borderRadius: 10,
    justifyContent: 'center',
    paddingLeft: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  courseText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CoursesScreen;

