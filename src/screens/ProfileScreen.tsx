import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { AcceptOnlyModal, AcceptRejectModal } from '../components/Modals';
import { API_URL } from '@env';
import { useAuth } from '../navigation/AuthContext';
import { NotificationService } from '../utils/NotificationService';

const ProfileScreen = () => {
  const navigation = useNavigation();

  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState(null);
  const [role, setRole] = useState(null);
  const [bio, setBio] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userImage, setUserImage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [userId, setUserId] = useState(null);
  const [hasPassword, setHasPassword] = useState(null);
  const { token } = useAuth();

  const [fcmToken, setFcmToken] = useState('');
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(false);

  // Estados para el modal de notificaciones
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Estados para configuraciones de notificaciones
  const [courseApprove, setCourseApprove] = useState('none');
  const [feedback, setFeedback] = useState('none');
  const [enrollment, setEnrollment] = useState('none');
  const [newAssignment, setNewAssignment] = useState('none');

  // ===============================================
  // NUEVOS ESTADOS PARA OVERLAY DE ÉXITO
  // ===============================================
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [overlayAnimation] = useState(new Animated.Value(0));

  // Opciones de notificación
  const notificationOptions = [
    { value: 'none', label: 'Disabled', icon: '🚫', color: '#6c757d' },
    { value: 'email', label: 'Email', icon: '📧', color: '#007bff' },
    { value: 'push', label: 'Push', icon: '📱', color: '#28a745' },
  ];

  // Tipos de notificación
  const notificationTypes = [
    {
      key: 'course_approve',
      title: 'Course Approval',
      description: 'When students are approved in your courses',
      state: courseApprove,
      setState: setCourseApprove,
    },
    {
      key: 'feedback',
      title: 'Feedback Received',
      description: 'When you receive feedback or comments',
      state: feedback,
      setState: setFeedback,
    },
    {
      key: 'enrollment',
      title: 'New Enrollment',
      description: 'When students enroll in your courses',
      state: enrollment,
      setState: setEnrollment,
    },
    {
      key: 'new_assignment', // ➕ AGREGAR TODO ESTE OBJETO
      title: 'New Assignment',
      description: 'When teachers create new assignments',
      state: newAssignment,
      setState: setNewAssignment,
    },
  ];

  // ===============================================
  // FUNCIONES DEL OVERLAY DE ÉXITO
  // ===============================================

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setShowSuccessOverlay(true);

    // Animación de entrada
    Animated.sequence([
      Animated.timing(overlayAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2500), // Mostrar por 2.5 segundos
      Animated.timing(overlayAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessOverlay(false);
    });
  };

  const dismissSuccessOverlay = () => {
    Animated.timing(overlayAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowSuccessOverlay(false);
    });
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const decoded = jwtDecode(token);
          const userIdFromToken = decoded.user_id || decoded.sub;
          setUserId(userIdFromToken);

          const response = await fetch(
            `${API_URL}/api/users/profile/${userIdFromToken}`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          const userProfile = await response.json();


          if (userProfile) {
            setFirstName(userProfile.name || 'No Name');
            setLastName(userProfile.last_name || 'No Last Name');
            setEmail(userProfile.email || 'No Email');
            setBio(userProfile.bio || '');
            setUserImage(userProfile.photo || userProfile.photo_url || null);
            setLocation(userProfile.location || null);
            setRole(userProfile.role || null);
            setPhoneNumber(userProfile.phone || '+543329602476');
          } else {
            setFirstName('No Name');
            setLastName('No Last Name');
            setEmail('No Email');
            setBio('');
            setUserImage(null);
            setLocation('');
            setRole(null);
          }

          if (userProfile.email) {
            await checkUserPassword(userProfile.email); // ✅ Usar el email del perfil
            console.log('User password check completed for:', userProfile.email);
          }


          // ✅ Solo obtener el token FCM sin inicializar todo el servicio
          const tokenResult = await NotificationService.getFCMToken();
          console.log('🔑 FCM Token:', tokenResult.token);
          setFcmToken(tokenResult.token);
          setNotificationPermissionGranted(tokenResult.hasPermission);

        }
      } catch (error) {
        console.error('Error al obtener el perfil del usuario:', error);
      }
    };

    fetchUserProfile();
  }, []);

  const fetchNotificationSettings = async () => {
    if (!userId) return;

    try {
      setLoadingNotifications(true);
      const response = await fetch(
        `${API_URL}/api/notification/${userId}/config`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        const settings = await response.json();
        console.log('Notification settings fetched sonn:', settings);
        setCourseApprove(settings.course_approve || 'none');
        setFeedback(settings.feedback || 'none');
        setEnrollment(settings.enrollment || 'none');
        setNewAssignment(settings.new_assignment || 'none');
      } else {
        console.log('No previous settings found, using defaults');
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setLoadingNotifications(false);
    }
  };

  const saveNotificationSettings = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    try {
      setSavingNotifications(true);

      const settings = {
        course_approve: courseApprove,
        feedback: feedback,
        enrollment: enrollment,
        new_assignment: newAssignment,
        fcm_token: fcmToken,
        notification_enabled: notificationPermissionGranted,
      };


      const response = await fetch(
        `${API_URL}/api/notification/${userId}/config`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(settings),
        },
      );

      if (response.ok) {
        setShowNotificationModal(false);

        // Pequeño delay para que se cierre el modal primero
        setTimeout(() => {
          showSuccessMessage('Notification settings updated successfully!');
        }, 300);
      } else {
        const errorData = await response.text();
        console.error('Error saving settings:', errorData);
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'Failed to save notification settings');
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleOpenNotificationModal = () => {
    setShowNotificationModal(true);
    fetchNotificationSettings();
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleSelectImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.5,
    });

    if (!result.didCancel && result.assets) {
      setUserImage(result.assets[0].uri);
    }
  };

  const handleSaveChanges = async () => {
    if (isLoading) return;

    if (
      !firstName ||
      !lastName ||
      firstName.length < 2 ||
      lastName.length < 2 ||
      !phoneNumber
    ) {
      setModalMessage(
        'The only field that can be empty is the bio. Please fill all fields.',
      );
      setShowModal(true);
      return;
    }

    if (!phoneNumber.startsWith('+54')) {
      setModalMessage('The number must start with +54');
      setShowModal(true);
      return;
    }

    try {
      setIsLoading(true);

      if (token && userId) {
        const response = await fetch(`${API_URL}/api/users/profile/${userId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: firstName,
            last_name: lastName,
            email: email,
            bio: bio,
            photo: userImage,
            phone: phoneNumber,
          }),
        });

        const result = await response.json();

        if (response.ok) {

          showSuccessMessage('✅ Profile updated successfully!');
        } else {
          console.error('Error al actualizar el perfil:', result);
          setModalMessage('Error updating profile');
          setShowModal(true);
        }
      }
    } catch (error) {
      console.error('Error al guardar los cambios:', error);
      setModalMessage('Error saving changes');
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const renderOptionButton = (option, isSelected, onPress) => (
    <TouchableOpacity
      key={option.value}
      style={[
        styles.optionButton,
        isSelected && { ...styles.selectedOption, borderColor: option.color },
      ]}
      onPress={onPress}
    >
      <Text style={styles.optionIcon}>{option.icon}</Text>
      <Text
        style={[
          styles.optionText,
          isSelected && { color: option.color, fontWeight: '600' },
        ]}
      >
        {option.label}
      </Text>
      {isSelected && (
        <View style={[styles.selectedDot, { backgroundColor: option.color }]} />
      )}
    </TouchableOpacity>
  );

  const renderNotificationType = (type) => (
    <View key={type.key} style={styles.notificationCard}>
      <View style={styles.notificationHeader}>
        <Text style={styles.notificationTitle}>{type.title}</Text>
        <Text style={styles.notificationDescription}>{type.description}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {notificationOptions.map((option) =>
          renderOptionButton(option, type.state === option.value, () =>
            type.setState(option.value),
          ),
        )}
      </View>
    </View>
  );
  const checkUserPassword = async (userEmail) => {

    try {
      const response = await fetch(
        `${API_URL}/api/auth/has-password/${userEmail}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('response status:', response.status,);
      if (response.ok) {

        const result = await response.json();
        setHasPassword(result.has_password);
      }
    } catch (error) {
      console.log('Estamos aca!!');
      console.error('Error checking password:', error);
    }
  };


  return (
    <View style={styles.container}>
      <AcceptOnlyModal
        visible={showModal}
        message={modalMessage}
        onAccept={() => setShowModal(false)}
        onClose={() => setShowModal(false)}
      />
      {showSuccessOverlay && (
        <Animated.View
          style={[
            styles.successOverlay,
            {
              opacity: overlayAnimation,
              transform: [
                {
                  translateY: overlayAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.successContainer}
            onPress={dismissSuccessOverlay}
            activeOpacity={0.9}
          >
            <View style={styles.successContent}>
              <View style={styles.successIcon}>
                <Text style={styles.successIconText}>✅</Text>
              </View>
              <View style={styles.successTextContainer}>
                <Text style={styles.successTitle}>Success!</Text>
                <Text style={styles.successMessage}>{successMessage}</Text>
              </View>
            </View>
            <View style={styles.dismissIndicator}>
              <Text style={styles.dismissText}>Tap to dismiss</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>My Profile</Text>

        <TouchableOpacity
          onPress={handleSelectImage}
          style={styles.imageSection}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri:
                  userImage || 'https://www.w3schools.com/howto/img_avatar.png',
              }}
              style={styles.profileImage}
            />
            <View style={styles.cameraIcon}>
              <Text style={styles.cameraText}>📷</Text>
            </View>
          </View>
          <Text style={styles.changeText}>Tap to change profile picture</Text>
        </TouchableOpacity>

        <View style={styles.formSection}>
          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
              />
            </View>

            <View style={styles.inputHalf}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
              />
            </View>
          </View>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={email}
            editable={false}
          />

          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={[styles.input, styles.readOnlyInput]}
                value={location || 'Not specified'}
                editable={false}
              />
            </View>

            <View style={styles.inputHalf}>
              <Text style={styles.label}>Role</Text>
              <TextInput
                style={[styles.input, styles.readOnlyInput]}
                value={role || 'Not specified'}
                editable={false}
              />
            </View>
          </View>

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="+54 3329 602476"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.buttonSection}>
          {role === 'student' && (
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={handleOpenNotificationModal}
            >
              <Text style={styles.notificationButtonText}>
                🔔 Edit Notifications
              </Text>
            </TouchableOpacity>
          )}

          {!hasPassword && (
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('SetPassword', { email })}
            >
              <Text style={styles.notificationButtonText}>
                🔒 Create password
              </Text>
            </TouchableOpacity>
          )}



          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.disabledButton]}
            onPress={handleSaveChanges}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de Notificaciones */}
      <Modal
        visible={showNotificationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔔 Notification Settings</Text>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setShowNotificationModal(false)}
              >
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingNotifications ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.loadingText}>Loading settings...</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalDescription}>
                  Choose how you want to receive notifications for different
                  events.
                </Text>

                {notificationTypes.map(renderNotificationType)}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[
                      styles.saveNotificationButton,
                      savingNotifications && styles.disabledButton,
                    ]}
                    onPress={saveNotificationSettings}
                    disabled={savingNotifications}
                  >
                    {savingNotifications ? (
                      <View style={styles.savingContainer}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.saveNotificationText}>
                          Saving...
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.saveNotificationText}>
                        Save Settings
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowNotificationModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
    backgroundColor: '#6c757d',
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#dc3545',
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#212529',
    marginBottom: 30,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007bff',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  cameraText: {
    fontSize: 16,
  },
  changeText: {
    color: '#6c757d',
    fontSize: 14,
    fontStyle: 'italic',
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  readOnlyInput: {
    backgroundColor: '#e9ecef',
    color: '#6c757d',
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonSection: {
    gap: 12,
  },
  notificationButton: {
    backgroundColor: '#17a2b8',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#6c757d',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // ===============================================
  // ESTILOS DEL OVERLAY DE ÉXITO
  // ===============================================
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: 320,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  successContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  successIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#d4edda',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  successIconText: {
    fontSize: 24,
  },
  successTextContainer: {
    flex: 1,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#155724',
    marginBottom: 4,
  },
  successMessage: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  dismissIndicator: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  dismissText: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
  },

  // Estilos del Modal (sin cambios)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  closeModalButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  notificationCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  notificationHeader: {
    marginBottom: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 12,
    color: '#6c757d',
    lineHeight: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    position: 'relative',
  },
  selectedOption: {
    backgroundColor: '#fff',
    borderWidth: 2,
  },
  optionIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  optionText: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modalButtons: {
    marginTop: 20,
    gap: 12,
  },
  saveNotificationButton: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveNotificationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
