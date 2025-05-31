import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { useNavigation } from '@react-navigation/native';

const submissionsData = [5, 10, 8, 4, 7];
const gradesData = [70, 85, 90, 78, 92];  
const average = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

const TeacherStatistics = () => {
  const navigation = useNavigation();

  const handleDownloadPDF = async () => {
    const htmlContent = `
      <h1>Statistics Report</h1>
      <p><strong>Average Submissions:</strong> ${average(submissionsData).toFixed(2)}</p>
      <p><strong>Average Grade:</strong> ${average(gradesData).toFixed(2)}</p>
    `;

    try {
      const options = {
        html: htmlContent,
        fileName: 'statistics',
        directory: 'Documents',
      };
      const file = await RNHTMLtoPDF.convert(options);
      Alert.alert('Success', `PDF saved to ${file.filePath}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Statistics</Text>

      <Text style={styles.label}>Submissions (avg: {average(submissionsData).toFixed(2)})</Text>
      <BarChart
        data={{
          labels: ['User1', 'User2', 'User3', 'User4', 'User5'],
          datasets: [{ data: submissionsData }],
        }}
        width={Dimensions.get('window').width - 80}
        height={220}
        yAxisLabel=""
        chartConfig={chartConfig}
        style={styles.chart}
      />

      <Text style={styles.label}>Grades (avg: {average(gradesData).toFixed(2)})</Text>
      <BarChart
        data={{
          labels: ['User1', 'User2', 'User3', 'User4', 'User5'],
          datasets: [{ data: gradesData }],
        }}
        width={Dimensions.get('window').width - 80}
        height={220}
        yAxisLabel=""
        chartConfig={chartConfig}
        style={styles.chart}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.sendButton} onPress={handleDownloadPDF}>
          <Text style={styles.buttonText}>Download</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  color: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
  labelColor: () => '#333',
  strokeWidth: 2,
  barPercentage: 0.6,
};

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
    marginTop: 10,
    marginBottom: 6,
  },
  chart: {
    marginBottom: 24,
    borderRadius: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  sendButton: {
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 10,
    flex: 0.48,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#555',
    padding: 14,
    borderRadius: 10,
    flex: 0.48,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default TeacherStatistics;
