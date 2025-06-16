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
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { API_URL } from '@env';
const { width } = Dimensions.get('window');
import { useAuth } from '../../navigation/AuthContext';
import StatusOverlay from '../../components/StatusOverlay';
import { AcceptOnlyModal } from '@/components/Modals';
import { getUserProfileData } from '../../utils/GetUserProfile';

const MembersScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { course } = route.params;
  const courseId = course.id;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvedMembers, setApprovedMembers] = useState([]);
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [saveChangueConfirmed, setChangueConfirmed] = useState(false);
  const [showAcceptOnlyModal, setShowAcceptOnlyModal] = useState(false);

  const [currentUserEmail, setCurrentUserEmail] = useState('');
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // ✅ OBTENER EMAIL DEL USUARIO ACTUAL
        const userProfile = await getUserProfileData(token);
        if (userProfile?.email) {
          setCurrentUserEmail(userProfile.email);
        }

        const response = await fetch(
          `${API_URL}/api/courses/${courseId}/members`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) throw new Error('Error al obtener los miembros');

        const data = await response.json();

        const enrichedMembers = await Promise.all(
          data.data.map(async (member) => {
            const profile = await getUserProfileData(token, member.user_id);
            return {
              ...member,
              email: profile?.email || '',
              name: profile?.name || '',
              lastname: profile?.lastName || '',
              photo: profile?.photo || '',
            };
          }),
        );

        setMembers(enrichedMembers);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [courseId, token]);

  const handleApprove = async (userId) => {
    setIsLoading(true);

    try {
      const res = await fetch(
        `${API_URL}/api/courses/approve/${userId}/${courseId}`,
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
      setIsLoading(false);

      setShowAcceptOnlyModal(true);
    } finally {
      setTimeout(() => {
        setChangueConfirmed(true);
        setTimeout(() => {
          setIsLoading(false);
          setChangueConfirmed(false);
          navigation.goBack();
        }, 1500);
      }, 1000);
    }
  };

  useEffect(() => {
    const fetchApprovedMembers = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/courses/${courseId}/approved-users`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) throw new Error('Error al obtener aprobados');

        const result = await response.json();
        setApprovedMembers(result.data);
      } catch (error) {
        console.error('Error al cargar aprobados:', error);
      }
    };

    fetchApprovedMembers();
  }, [courseId, token]);

  return isLoading ? (
    <StatusOverlay
      loading={!saveChangueConfirmed}
      success={saveChangueConfirmed}
      loadingMsg="Approving student..."
      successMsg="Student approved successfully!"
    />
  ) : (
    <SafeAreaView style={styles.container}>
      <AcceptOnlyModal
        visible={showAcceptOnlyModal}
        onClose={() => setShowAcceptOnlyModal(false)}
        message="You have already approved this student!"
      />
      <Text style={styles.header}>Course Members</Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2c3e50"
          style={{ marginTop: 30 }}
        />
      ) : (
        <>
          <Text style={styles.sectionHeader}>Students</Text>

          <FlatList
            data={members}
            keyExtractor={(item, index) =>
              item.user_id?.toString() || index.toString()
            }
            renderItem={({ item }) => {
              const isApproved = approvedMembers.includes(item.user_id);
              return (
                <View style={styles.memberItem}>
                  <Image
                    source={
                      item.photo
                        ? item.photo
                        : {
                            uri: 'https://www.w3schools.com/howto/img_avatar.png',
                          }
                    }
                    style={styles.memberImage}
                  />

                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>
                      {item.name} {item.lastname}
                    </Text>
                    <Text style={styles.memberEmail}>{item.email}</Text>

                    <View style={styles.buttonsContainer}>
                      {!isApproved && currentUserEmail === course.createdBy && (
                        <TouchableOpacity
                          style={styles.approveButton}
                          onPress={() => handleApprove(item.user_id)}
                        >
                          <Text style={styles.approveButtonText}>Approve</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[
                          styles.approveButton,
                          { backgroundColor: '#95a5a6', marginLeft: 5 },
                        ]}
                        onPress={() => {
                          navigation.navigate('StudentIndividualStatistics', {
                            course,
                            userId: item.user_id,
                            studentName: item.name,
                          });
                        }}
                      >
                        <Text style={styles.approveButtonText}>Statistics</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.approveButton,
                          { backgroundColor: '#95a5a6', marginLeft: 5 },
                        ]}
                        onPress={() =>
                          navigation.navigate('TeacherFeedbackStudent', {
                            studentId: item.user_id,
                            courseId,
                          })
                        }
                      >
                        <Text style={styles.approveButtonText}>Feedback</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            }}
            style={styles.memberList}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        </>
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
    textAlign: 'center',
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
  memberImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    marginTop: 4,
  },

  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 5,
  },
});

export default MembersScreen;
