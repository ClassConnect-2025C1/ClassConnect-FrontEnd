import { useNavigation } from '@react-navigation/native';

const CoursesScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.topHalf}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
        />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Courses</Text>
        <Text style={styles.subtitle}>Select a course to view details</Text>

        {/* Add your course selection logic here */}
      </View>
    </View>
  );
};
