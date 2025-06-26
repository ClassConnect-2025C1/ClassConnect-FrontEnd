import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { AcceptOnlyModal } from '../components/Modals';

const RoleSelectionScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { googleToken, userInfo } = route.params;

    const [selectedRole, setSelectedRole] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const roles = [
        {
            id: 'teacher',
            title: 'Teacher',
            description: 'Create and manage courses',
            icon: '👨‍🏫',
            color: '#4CAF50'
        },
        {
            id: 'student',
            title: 'Student',
            description: 'Join courses and learn',
            icon: '🎓',
            color: '#2196F3'
        }
    ];

    const handleRoleSelect = (roleId) => {
        setSelectedRole(roleId);
    };

    const handleContinue = async () => {
        if (!selectedRole) {
            setErrorMessage('Please select a role to continue');
            setShowErrorModal(true);
            return;
        }

        setLoading(true);

        try {
            // Enviar al backend con el rol seleccionado
            const response = await fetch(`${API_URL}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    google_token: googleToken,
                    role: selectedRole
                }),
            });

            const data = await response.json();
            console.log('Registration response:', data);

            if (!response.ok) {
                setErrorMessage(data.detail || 'Error during registration');
                setShowErrorModal(true);
                return;
            }


            const backendToken = data.access_token;
            await AsyncStorage.setItem('token', backendToken);

            const decoded = jwtDecode(backendToken);
            const user_id = decoded.user_id;

            // Navegar según el rol seleccionado
            if (selectedRole === 'teacher') {
                navigation.navigate('TeacherCourses');
            } else {
                navigation.navigate('StudentCourses', { userId: user_id });
            }

        } catch (error) {
            console.error('Error completing registration:', error);
            setErrorMessage('An error occurred. Please try again.');
            setShowErrorModal(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <AcceptOnlyModal
                visible={showErrorModal}
                message={errorMessage}
                onAccept={() => setShowErrorModal(false)}
                onClose={() => setShowErrorModal(false)}
            />

            <View style={styles.header}>
                <Image
                    source={require('../../assets/images/logo.png')}
                    style={styles.logo}
                />
                <Text style={styles.title}>Welcome to ClassConnect!</Text>
                <Text style={styles.subtitle}>
                    Hi {userInfo?.name || 'there'}! Please select your role to get started.
                </Text>
            </View>

            <View style={styles.rolesContainer}>
                <Text style={styles.sectionTitle}>Choose Your Role</Text>

                {roles.map((role) => (
                    <TouchableOpacity
                        key={role.id}
                        style={[
                            styles.roleCard,
                            selectedRole === role.id && {
                                borderColor: role.color,
                                backgroundColor: `${role.color}15`,
                            },
                        ]}
                        onPress={() => handleRoleSelect(role.id)}
                    >
                        <View style={styles.roleContent}>
                            <View style={styles.roleIcon}>
                                <Text style={styles.roleIconText}>{role.icon}</Text>
                            </View>

                            <View style={styles.roleInfo}>
                                <Text style={[
                                    styles.roleTitle,
                                    selectedRole === role.id && { color: role.color }
                                ]}>
                                    {role.title}
                                </Text>
                                <Text style={styles.roleDescription}>{role.description}</Text>
                            </View>

                            {selectedRole === role.id && (
                                <View style={[styles.checkmark, { backgroundColor: role.color }]}>
                                    <Text style={styles.checkmarkText}>✓</Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        !selectedRole && styles.disabledButton,
                        selectedRole && { backgroundColor: roles.find(r => r.id === selectedRole)?.color }
                    ]}
                    onPress={handleContinue}
                    disabled={!selectedRole || loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.continueButtonText}>
                            Continue as {selectedRole ? roles.find(r => r.id === selectedRole)?.title : 'User'}
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    disabled={loading}
                >
                    <Text style={styles.backButtonText}>Back to Login</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default RoleSelectionScreen;


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    logo: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    rolesContainer: {
        flex: 1,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    roleCard: {
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        backgroundColor: '#fff',
    },
    roleContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    roleIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    roleIconText: {
        fontSize: 28,
    },
    roleInfo: {
        flex: 1,
    },
    roleTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    roleDescription: {
        fontSize: 14,
        color: '#666',
    },
    checkmark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmarkText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    buttonContainer: {
        padding: 24,
        paddingBottom: 40,
    },
    continueButton: {
        backgroundColor: '#ccc',
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    backButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#666',
        fontSize: 14,
    },
});