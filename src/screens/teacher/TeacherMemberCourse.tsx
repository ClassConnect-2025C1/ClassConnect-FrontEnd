import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const MembersScreen = () => {
  const navigation = useNavigation();
  const members = [
    {
      id: '1',
      name: 'John Doe',
      role: 'Student',
      email: 'john.doe@example.com',
    },
    {
      id: '2',
      name: 'Jane Smith',
      role: 'Student',
      email: 'jane.smith@example.com',
    },
    {
      id: '3',
      name: 'Alice Brown',
      role: 'Student',
      email: 'alice.brown@example.com',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Course Members</Text>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.memberItem}>
            <Text style={styles.memberName}>{item.name}</Text>
            <Text style={styles.memberRole}>{item.role}</Text>
            <Text style={styles.memberEmail}>{item.email}</Text>
          </View>
        )}
        ListHeaderComponent={<Text style={styles.sectionHeader}>Members</Text>}
        style={styles.memberList}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f7',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#34495e',
  },
  memberList: {
    flex: 1,
  },
  memberItem: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  memberRole: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 20,
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  closeButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default MembersScreen;
