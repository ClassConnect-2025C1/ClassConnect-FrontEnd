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

      <View style={styles.header}>
        <Image
          source={require('../../../assets/images/logo.png')}
          style={styles.icon}
        />
        <Text style={styles.headerTitle}>ClassConnect</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
        <Image
          source={require('../../../assets/images/profile/profile-icon.jpg')}
          style={styles.icon}
        />
        </TouchableOpacity>
      </View>


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

      <TouchableOpacity
        style={{
          backgroundColor: '#aaa',
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 20,
          alignSelf: 'center',
          marginBottom: 10,
        }}
        onPress={() => navigation.navigate('AvailableCourses')}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Available courses</Text>
      </TouchableOpacity>


      <View style={{ height: 1, backgroundColor: '#ccc', opacity: 0.5, marginHorizontal: 20, marginBottom: 5 }} />

      <View
        style={[
          styles.bottomBar,
          {
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
          },
        ]}
      >
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => console.log('Icon 1')}
        >
          <Image
            source={require('../../../assets/images/courses/layers.png')}
            style={styles.icon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => console.log('Icon 2')}
        >
          <Image
            source={require('../../../assets/images/courses/imbox.png')}
            style={styles.icon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => console.log('Icon 3')}
        >
          <Image
            source={require('../../../assets/images/courses/settings.png')}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
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

  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  iconContainer: {
    padding: 10,
  },

  icon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
});

export default CoursesScreen;
