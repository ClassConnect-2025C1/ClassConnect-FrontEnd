import React from 'react';
import { View, Text, Image, StyleSheet, Pressable,TouchableOpacity } from 'react-native';
import { useFonts } from 'expo-font';
import { useNavigation } from '@react-navigation/native';

const StartScreen = () => {
    const navigation = useNavigation();
  const [fontsLoaded] = useFonts({
    'outfit': require('../../assets/fonts/Outfit-Bold.ttf'),
    'outfit-medium': require('../../assets/fonts/Outfit-Medium.ttf'),
    'outfit-regular': require('../../assets/fonts/Outfit-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.classConnectText}>ClassConnect</Text>
      </View>

      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
      />

      <View style={styles.buttonsContainer}>
        <Pressable style={styles.primaryButton}>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>
         </Pressable>

        <Pressable style={styles.secondaryButton}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.secondaryButtonText}>Log In</Text>
            </TouchableOpacity>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  welcomeText: {
    fontFamily: 'outfit-regular',
    fontSize: 24,
    color: '#555',
  },
  classConnectText: {
    fontFamily: 'outfit',
    fontSize: 32,
    color: '#222',
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: 50,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 15,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    borderRadius: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'outfit-medium',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
    paddingVertical: 18,
    borderRadius: 20,
    width: '100%',
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 18,
    fontFamily: 'outfit-medium',
    textAlign: 'center',
  },
});

export default StartScreen;


