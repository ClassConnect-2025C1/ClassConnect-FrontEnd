import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import { API_URL } from '@env';
import StatusOverlay from '../components/StatusOverlay';
import { useAuth } from '../navigation/AuthContext';

const SetPasswordScreen = () => {
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [feedbackSent, setFeedbackSent] = useState(false);
    const navigation = useNavigation();
    const route = useRoute();
    const { email } = route.params;

    const setPassword = async () => {
        if (newPassword.length < 5) {
            setPasswordError('Password must be at least 5 characters');
            return;
        }
        setPasswordError('');

        try {
            setLoading(true);

            const response = await axios.put(
                `${API_URL}/api/auth/set-password`,
                {
                    new_password: newPassword,
                    userEmail: email,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );

            if (response.status === 200) {
                setFeedbackSent(true);
                setTimeout(() => {
                    setLoading(false);
                    setFeedbackSent(false);

                    navigation.goBack();
                }, 2000);
            } else {
                setPasswordError('Failed to set password. Please try again.');
            }
        } catch (error) {
            console.error('Error setting password:', error);
            if (error.response?.status === 400) {
                setPasswordError('Password already set for this user.');
            } else if (error.response?.status === 404) {
                setPasswordError('User not found.');
            } else {
                setPasswordError('Failed to set password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Mostrar el overlay si se está cargando */}
            {loading && !feedbackSent && (
                <View style={styles.overlayContainer}>
                    <StatusOverlay
                        loading={loading}
                        success={false}
                        loadingMsg="Setting password..."
                    />
                </View>
            )}

            {/* Mostrar el overlay con el mensaje de éxito */}
            {feedbackSent && (
                <View style={styles.overlayContainer}>
                    <StatusOverlay
                        loading={false}
                        success={true}
                        successMsg="Password set successfully!"
                    />
                </View>
            )}

            {/* El contenido principal solo se muestra cuando no hay carga */}
            {!loading && !feedbackSent && (
                <>
                    <Text style={styles.title}>Set your password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="New password"
                        secureTextEntry
                        value={newPassword}
                        onChangeText={setNewPassword}
                    />

                    {passwordError ? (
                        <Text style={styles.errorText}>{passwordError}</Text>
                    ) : null}

                    <TouchableOpacity
                        style={styles.setButton}
                        onPress={setPassword}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'Setting...' : 'Set Password'}
                        </Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 20,
    },
    overlayContainer: {
        ...StyleSheet.absoluteFillObject, // Cubre toda la pantalla
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // Fondo blanco con opacidad
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 30,
        textAlign: 'center',
    },
    input: {
        width: '80%',
        borderColor: '#CCCCCC',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
    },
    setButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 15,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    errorText: {
        color: 'red',
        fontSize: 14,
        marginBottom: 10,
        textAlign: 'center',
    },
});

export default SetPasswordScreen;