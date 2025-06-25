import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Animated,
    TouchableOpacity,
    StyleSheet,
    Platform,
} from 'react-native';

interface NotificationToastProps {
    visible: boolean;
    title: string;
    body: string;
    onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
    visible,
    title,
    body,
    onClose,
}) => {
    const slideAnim = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (visible) {
            // Mostrar
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
            }).start();

            // Auto-cerrar después de 4 segundos
            const timer = setTimeout(() => {
                onClose();
            }, 4000);

            return () => clearTimeout(timer);
        } else {
            slideAnim.setValue(-100);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                { transform: [{ translateY: slideAnim }] },
            ]}
        >
            <TouchableOpacity style={styles.content} onPress={onClose}>
                <Text style={styles.icon}>📱</Text>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.body}>{body}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeText}>×</Text>
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 16,
        right: 16,
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 12,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    icon: {
        fontSize: 20,
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    body: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 14,
    },
    closeButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    closeText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});