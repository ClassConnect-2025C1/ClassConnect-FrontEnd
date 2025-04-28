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

const FeedbackScreen = () => {
  const navigation = useNavigation();
  const [selectedFilter, setSelectedFilter] = useState('Any');
  const [fromDate] = useState('25/02/2025');
  const [toDate] = useState('30/02/2025');

  const feedbacks = [
    {
      id: '1',
      title: 'Another positive feedback',
      content: 'But this time longer',
      rating: 5,
    },
    {
      id: '2',
      title: 'Now a negative feedback',
      content:
        'The professor had us waiting for a whole month to give us the grades and we never even got to learn anything',
      rating: 2,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Course Feedbacks</Text>

      <View style={styles.filterContainer}>
        <View style={styles.dateFilter}>
          <Text style={styles.filterLabel}>From</Text>
          <View style={styles.dateBox}>
            <Text style={styles.dateText}>{fromDate}</Text>
          </View>
        </View>

        <View style={styles.dateFilter}>
          <Text style={styles.filterLabel}>To</Text>
          <View style={styles.dateBox}>
            <Text style={styles.dateText}>{toDate}</Text>
          </View>
        </View>

        <View style={styles.ratingFilter}>
          <Text style={styles.filterLabel}>Rating</Text>
          <View style={styles.ratingBox}>
            <Text style={styles.ratingText}>{selectedFilter}</Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="black" />
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <FlatList
        data={feedbacks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.feedbackItem}>
            <View style={styles.feedbackHeader}>
              <Text style={styles.feedbackTitle}>{item.title}</Text>
              <Text style={styles.feedbackRating}>Rating: {item.rating}</Text>
            </View>
            <Text style={styles.feedbackContent}>{item.content}</Text>
          </View>
        )}
        ListHeaderComponent={
          <Text style={styles.sectionHeader}>Feedbacks</Text>
        }
        style={styles.feedbackList}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Close</Text>
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
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateFilter: {
    flex: 1,
    marginRight: 8,
  },
  ratingFilter: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 4,
    fontWeight: '500',
  },
  dateBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateText: {
    fontSize: 14,
    color: '#2c3e50',
    marginRight: 8,
  },
  ratingBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  divider: {
    height: 1,
    backgroundColor: '#dcdde1',
    marginVertical: 16,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#34495e',
  },
  feedbackList: {
    flex: 1,
  },
  feedbackItem: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    color: '#2c3e50',
    marginRight: 10,
  },
  feedbackRating: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  feedbackContent: {
    fontSize: 15,
    color: '#7f8c8d',
    lineHeight: 22,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 20,
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
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
  backButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default FeedbackScreen;
