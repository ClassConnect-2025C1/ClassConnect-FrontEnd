import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { API_URL } from '@env';
const { width } = Dimensions.get('window');
import { useAuth } from '../../navigation/AuthContext';
const MembersScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { course } = route.params;
  const courseId = course.id;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvedMembers, setApprovedMembers] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch(`${API_URL}/${courseId}/members`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('Error al obtener los miembros');
        const data = await response.json();
        setMembers(data.data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [courseId, token]); // Agregar token como dependencia

  const handleApprove = async (userId) => {
    try {
      const res = await fetch(
        `${API_URL}/approve/${userId}/${courseId}`,

        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!res.ok) throw new Error('Aprobación fallida');

      setApprovedMembers((prev) => [...prev, userId]);
    } catch (error) {
      console.error('Error al aprobar:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Course Members</Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2c3e50"
          style={{ marginTop: 30 }}
        />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item, index) =>
            item.id?.toString() || index.toString()
          }
          renderItem={({ item }) => {
            const isApproved = approvedMembers.includes(item.id);
            return (
              <View style={styles.memberItem}>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberRole}>
                    {item.role || 'student'}
                  </Text>
                </View>
                <View style={styles.buttonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.approveButton,
                      isApproved && {
                        backgroundColor: '#bdc3c7',
                        opacity: 0.6,
                      },
                    ]}
                    onPress={() => handleApprove(item.user_id)}
                    disabled={isApproved}
                  >
                    <Text style={styles.approveButtonText}>
                      {isApproved ? 'Approved' : 'Approve'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() =>
                      navigation.navigate('ShowProfileData', {
                        userId: item.user_id,
                        token: token,
                      })
                    }
                  >
                    <Text style={styles.profileButtonText}>Profile</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListHeaderComponent={
            <Text style={styles.sectionHeader}>Members</Text>
          }
          style={styles.memberList}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

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
    flexDirection: 'row',
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
  memberInfo: {
    flex: 1,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
  },
  approveButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  profileButton: {
    backgroundColor: '#3498db',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  profileButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
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
