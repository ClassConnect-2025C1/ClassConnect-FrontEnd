import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { API_URL } from '@env';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { useAuth } from '../../navigation/AuthContext';
import { getUserProfileData } from '../../utils/GetUserProfile';
import * as Print from 'expo-print';
import { downloadAndShareFile } from '../../utils/FileDowloader';
import { captureRef } from 'react-native-view-shot';

const { width } = Dimensions.get('window');

const StudentIndividualStatistics = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { studentId, courseId } = route.params;

  // Estados
  const [studentProfile, setStudentProfile] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const { token } = useAuth();

  // Referencias para PDF
  const gradeChartRef = useRef();
  const trendChartRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Obtener perfil del estudiante
        const profile = await getUserProfileData(token, studentId);
        setStudentProfile(profile);

        // Obtener estadísticas del estudiante
        const response = await fetch(
          `${API_URL}/api/courses/${courseId}/statistics/course/1/user/${studentId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error('Error al obtener estadísticas');

        const data = await response.json();
        setStatistics(data.statistics);
      } catch (error) {
        console.error('Error:', error);
        Alert.alert('Error', 'Failed to load student statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId, courseId, token]);

  // Generar datos para gráficos
  const getChartData = () => {
    if (!statistics) return null;

    // Datos generales
    const gradeData = {
      labels: ['Average'],
      datasets: [{
        data: [statistics.average_grade || 0, 0] // Agregar 0 para escala
      }]
    };

    const submissionData = {
      labels: ['Completion'],
      datasets: [{
        data: [(statistics.submission_rate * 100) || 0, 0] // Convertir a porcentaje
      }]
    };

    // Datos de tendencia si existen
    let trendData = null;
    if (statistics.statistics_for_dates && statistics.statistics_for_dates.length > 1) {
      // Filtrar fechas válidas
      const validDates = statistics.statistics_for_dates.filter(item => {
        const date = new Date(item.date);
        return date.getFullYear() > 1900; // Filtrar fechas "0001-01-01"
      });

      if (validDates.length > 0) {
        trendData = {
          labels: validDates.map(item => {
            const date = new Date(item.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }),
          datasets: [{
            data: validDates.map(item => item.average_grade || 0),
            color: (opacity = 1) => `rgba(34, 202, 236, ${opacity})`,
            strokeWidth: 2
          }]
        };
      }
    }

    return { gradeData, submissionData, trendData };
  };

  // Exportar PDF
  const handleExportPDF = async () => {
    setGeneratingPDF(true);
    
    try {
      const chartData = getChartData();
      
      // Capturar gráficos
      let gradeChartImage = '';
      let trendChartImage = '';
      
      if (gradeChartRef.current) {
        try {
          gradeChartImage = await captureRef(gradeChartRef.current, {
            format: 'png',
            quality: 0.8,
            result: 'base64'
          });
        } catch (error) {
          console.log('Error capturing grade chart:', error);
        }
      }
      
      if (trendChartRef.current && chartData?.trendData) {
        try {
          trendChartImage = await captureRef(trendChartRef.current, {
            format: 'png',
            quality: 0.8,
            result: 'base64'
          });
        } catch (error) {
          console.log('Error capturing trend chart:', error);
        }
      }

      const htmlContent = `
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
              .header { text-align: center; border-bottom: 2px solid #22CAEC; padding: 20px; background: #f0f8ff; margin-bottom: 20px; }
              .student-info { background: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #22CAEC; }
              .stats { background: #e8f5e8; padding: 15px; margin: 15px 0; border-radius: 8px; }
              .metric { margin: 10px 0; padding: 8px; background: white; border-radius: 5px; }
              .chart-section { margin: 20px 0; page-break-inside: avoid; }
              .chart-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
              .chart-image { width: 100%; max-width: 500px; height: auto; border: 1px solid #ddd; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📊 Student Performance Report</h1>
              <p>Generated: ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="student-info">
              <h2>👤 Student Information</h2>
              <div class="metric"><strong>Name:</strong> ${studentProfile?.name || ''} ${studentProfile?.lastName || ''}</div>
              <div class="metric"><strong>Email:</strong> ${studentProfile?.email || ''}</div>
            </div>
            
            <div class="stats">
              <h2>📈 Performance Summary</h2>
              <div class="metric"><strong>Average Grade:</strong> ${statistics?.average_grade?.toFixed(1) || 'N/A'}</div>
              <div class="metric"><strong>Completion Rate:</strong> ${((statistics?.submission_rate || 0) * 100).toFixed(1)}%</div>
            </div>

            ${gradeChartImage ? `
              <div class="chart-section">
                <h2 class="chart-title">📊 Grade Overview</h2>
                <img src="data:image/png;base64,${gradeChartImage}" class="chart-image" alt="Grade Chart" />
              </div>
            ` : ''}

            ${trendChartImage ? `
              <div class="chart-section">
                <h2 class="chart-title">📈 Performance Trends</h2>
                <img src="data:image/png;base64,${trendChartImage}" class="chart-image" alt="Trend Chart" />
              </div>
            ` : ''}
          </body>
        </html>
      `;

      const { base64 } = await Print.printToFileAsync({
        html: htmlContent,
        base64: true
      });

      const fileName = `student_${studentProfile?.name || 'report'}_${Date.now()}.pdf`;
      await downloadAndShareFile({ name: fileName, content: base64 });
      
      Alert.alert('Success', 'PDF exported successfully!');
      
    } catch (error) {
      console.error('PDF Export Error:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#22CAEC" style={{ marginTop: 100 }} />
        <Text style={styles.loadingText}>Loading student statistics...</Text>
      </SafeAreaView>
    );
  }

  if (!statistics || !studentProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No statistics available for this student</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const chartData = getChartData();
  const screenWidth = Dimensions.get('window').width;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ flex: 1 }}>
        {/* Header */}
        <Text style={styles.header}>Student Statistics</Text>

        {/* Student Info Card */}
        <View style={styles.studentCard}>
          <Image
            source={
              studentProfile.photo
                ? { uri: studentProfile.photo }
                : { uri: 'https://www.w3schools.com/howto/img_avatar.png' }
            }
            style={styles.studentImage}
          />
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>
              {studentProfile.name} {studentProfile.lastName}
            </Text>
            <Text style={styles.studentEmail}>{studentProfile.email}</Text>
          </View>
        </View>

        {/* Statistics Summary */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>📈 Performance Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{statistics.average_grade?.toFixed(1) || '0'}</Text>
              <Text style={styles.statLabel}>Average Grade</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {((statistics.submission_rate || 0) * 100).toFixed(1)}%
              </Text>
              <Text style={styles.statLabel}>Completion Rate</Text>
            </View>
          </View>
        </View>

        {/* Charts */}
        {chartData && (
          <View style={styles.chartsContainer}>
            {/* Grade Chart */}
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>📊 Grade Overview</Text>
              <View ref={gradeChartRef} style={{ backgroundColor: 'white', alignItems: 'center' }}>
                <BarChart
                  data={chartData.gradeData}
                  width={screenWidth - 40}
                  height={200}
                  chartConfig={chartConfig}
                  style={styles.chart}
                />
              </View>
            </View>

            {/* Trend Chart */}
            {chartData.trendData && (
              <View style={styles.chartSection}>
                <Text style={styles.chartTitle}>📈 Performance Trends</Text>
                <View ref={trendChartRef} style={{ backgroundColor: 'white', alignItems: 'center' }}>
                  <LineChart
                    data={chartData.trendData}
                    width={screenWidth - 40}
                    height={200}
                    chartConfig={chartConfig}
                    style={styles.chart}
                    bezier
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.exportButton, generatingPDF && styles.disabledButton]} 
            onPress={handleExportPDF}
            disabled={generatingPDF}
          >
            {generatingPDF ? (
              <View style={styles.loadingButton}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={[styles.buttonText, { marginLeft: 8 }]}>Generating...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>📄 Export PDF</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Close Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Configuración de gráficos
const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#f8f9fa',
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(34, 202, 236, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#22CAEC',
  },
  propsForBackgroundLines: {
    strokeDasharray: '',
    stroke: '#e3e3e3',
    strokeWidth: 1,
  },
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
  studentCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  statsContainer: {
    backgroundColor: '#fff',
    margin: 0,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22CAEC',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  chartsContainer: {
    marginBottom: 80,
  },
  chartSection: {
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 8,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  exportButton: {
    backgroundColor: '#22CAEC',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  disabledButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 20,
    width: width - 32,
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
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 18,
    color: '#e74c3c',
  },
});

export default StudentIndividualStatistics;