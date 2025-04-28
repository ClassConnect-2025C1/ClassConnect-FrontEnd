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
      type: 'positive',
    },
    {
      id: '2',
      title: 'Now a negative feedback',
      content:
        'The professor had us waiting for a while month to give us the grades and we never even got to learn anything',
      type: 'negative',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Título centrado */}
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
          <View
            style={[
              styles.feedbackItem,
              item.type === 'positive'
                ? styles.positiveFeedback
                : styles.negativeFeedback,
            ]}
          >
            <Text style={styles.feedbackTitle}>{item.title}</Text>
            <Text style={styles.feedbackContent}>{item.content}</Text>
          </View>
        )}
        ListHeaderComponent={
          <Text style={styles.sectionHeader}>Feedbacks</Text>
        }
        style={styles.feedbackList}
        contentContainerStyle={{ paddingBottom: 100 }} // Para no tapar la lista con el botón
      />

      {/* Botón Back abajo */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: 'black',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
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
    color: '#666',
    marginBottom: 4,
  },
  dateBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  dateText: {
    fontSize: 14,
  },
  ratingBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  feedbackList: {
    flex: 1,
  },
  feedbackItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  positiveFeedback: {
    backgroundColor: '#f0f8ff',
    borderLeftColor: '#4caf50',
  },
  negativeFeedback: {
    backgroundColor: '#fff0f0',
    borderLeftColor: '#f44336',
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  feedbackContent: {
    fontSize: 14,
    color: '#555',
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
    color: 'dark',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default FeedbackScreen;
