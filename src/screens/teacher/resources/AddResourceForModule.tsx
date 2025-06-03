import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { API_URL } from '@env';

const AddResourceForModule = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { token, course, module } = route.params;

    const [link, setLink] = useState('');

    const uploadFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });

            if (result.canceled || !result.assets?.[0]) return;

            const file = result.assets[0];
            const fileName = file.name;
            const fileUri = file.uri;
            const mimeType = file.mimeType || 'application/octet-stream';
       
            const formData = new FormData();

            formData.append('file', {
                uri: fileUri,
                name: fileName,
                type: mimeType,
            } as any);

            console.log('formData.get("file")', formData.get('file'));

            const response = await fetch(
                `${API_URL}/api/courses/${course.id}/resource/module/${module.module_id}`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
            
                    },
                    body: formData,
                }
            );

            const responseBody = await response.text();

            if (!response.ok) {
                console.error('Error response from server:', responseBody);
                throw new Error(`File upload failed: ${response.status} - ${responseBody}`);
            }

            Alert.alert('Success', 'File uploaded successfully');
            navigation.goBack();
        } catch (error) {
            console.error('File upload error:', error);
            Alert.alert('Error', 'Failed to upload file');
        }
    };

    const uploadLink = async () => {
        const trimmed = link.trim();
        if (!/^https?:\/\/\S+$/.test(trimmed)) {
            Alert.alert('Invalid link', 'Please enter a valid URL');
            return;
        }

        const formData = new FormData();
        formData.append('link', trimmed);

        try {
            const response = await fetch(
                `${API_URL}/api/courses/${course.id}/resource/module/${module.module_id}`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            if (!response.ok) throw new Error('Link upload failed');
            Alert.alert('Success', 'Link added successfully');
            navigation.goBack();
        } catch (error) {
            console.error('Link upload error:', error);
            Alert.alert('Error', 'Failed to add link');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Add Resource to Module</Text>

            <TouchableOpacity style={styles.sendButton} onPress={uploadFile}>
                <Text style={styles.buttonText}>Add File</Text>
            </TouchableOpacity>

            <View style={{ marginVertical: 20 }}>
                <Text style={styles.label}>Add a Link</Text>
                <TextInput
                    style={styles.input}
                    value={link}
                    onChangeText={setLink}
                    placeholder="https://example.com/resource"
                    placeholderTextColor="#aaa"
                />
                <TouchableOpacity style={styles.sendButton} onPress={uploadLink}>
                    <Text style={styles.buttonText}>Add Link</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
        </View>
    );
};

export default AddResourceForModule;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 40,
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    title: {
        alignSelf: 'center',
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#aaa',
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        marginBottom: 10,
    },
    sendButton: {
        backgroundColor: '#333',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#555',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
