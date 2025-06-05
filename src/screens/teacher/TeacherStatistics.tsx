import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '@env';
import { useAuth } from '../../navigation/AuthContext';
import * as Print from 'expo-print';
import { downloadAndShareFile } from '../../utils/FileDowloader';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';


const TeacherStatistics = () => {
  const navigation = useNavigation();
  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [showCourseModal, setShowCourseModal] = useState(false);
  
  // Date filters
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const { token } = useAuth();


  const [isInitialLoad, setIsInitialLoad] = useState(true);

useEffect(() => {
  fetchStatistics(true); // true = mostrar loading inicial
  
  // Polling silencioso cada 30 segundos
  const interval = setInterval(() => {
    fetchStatistics(false); // false = no mostrar loading
  }, 5000);

  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'active') {
      fetchStatistics(false); // Silencioso al volver a la app
    }
  };

  const subscription = AppState.addEventListener('change', handleAppStateChange);

  return () => {
    clearInterval(interval);
    subscription?.remove();
  };
}, []);


  const fetchStatistics = async (showLoading = false) => {
  try {
    if (showLoading) {
      setLoading(true);
    }
    
    const response = await fetch(`${API_URL}/api/courses/statistics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Failed to fetch statistics');
    
    const data = await response.json();
    const newStats = data.statistics || [];
    
    // Solo actualizar si realmente cambió algo
    const hasChanges = JSON.stringify(newStats) !== JSON.stringify(statistics);
    
    if (hasChanges || isInitialLoad) {
      setStatistics(newStats);
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    }
  } catch (error) {
    if (showLoading) {
      Alert.alert('Error', 'Failed to load statistics');
    }
  } finally {
    if (showLoading) {
      setLoading(false);
    }
  }
};

  // Filter data by course and date range
  const getFilteredData = () => {
    let courses = selectedCourse === 'all' ? statistics : 
      statistics.filter(course => course.course_id.toString() === selectedCourse);

    return courses.map(course => {
      if (course.statistics_for_dates?.length > 0) {
        const filteredDates = course.statistics_for_dates.filter(item => {
          const date = new Date(item.date);
          return date >= startDate && date <= endDate;
        });

        return {
          ...course,
          statistics_for_dates: filteredDates,
          period_avg_grade: filteredDates.length > 0 ? 
            filteredDates.reduce((sum, item) => sum + (item.average_grade || 0), 0) / filteredDates.length : 
            course.global_average_grade,
          period_submission_rate: filteredDates.length > 0 ?
            filteredDates.reduce((sum, item) => sum + (item.submission_rate || 0), 0) / filteredDates.length :
            course.global_submission_rate,
        };
      }
      return course;
    });
  };

  // Calculate global stats
  const getGlobalStats = () => {
    const filteredCourses = getFilteredData();
    const activeCourses = filteredCourses.filter(c => 
      (c.period_avg_grade || c.global_average_grade) > 0
    );

    if (activeCourses.length === 0) return null;

    const avgGrade = activeCourses.reduce((sum, c) => 
      sum + (c.period_avg_grade || c.global_average_grade || 0), 0
    ) / activeCourses.length;

    const avgSubmissionRate = activeCourses.reduce((sum, c) => 
      sum + (c.period_submission_rate || c.global_submission_rate || 0), 0
    ) / activeCourses.length;

    return {
      averageGrade: avgGrade.toFixed(1),
      submissionRate: (avgSubmissionRate * 100).toFixed(1),
      activeCourses: activeCourses.length,
      totalCourses: filteredCourses.length,
    };
  };

  // Generate chart data
 // Generate chart data
const getChartData = () => {
  const filteredCourses = getFilteredData().slice(0, 5);
  
  // Datos para gráfico de calificaciones
  const gradeValues = filteredCourses.map(c => c.period_avg_grade || c.global_average_grade || 0);
  
  // Grades bar chart - FORZAR que inicie en 0
  const gradeData = {
    labels: filteredCourses.map(c => c.course_name.substring(0, 8)),
    datasets: [{
      data: [...gradeValues, 0] // 🎯 Agregar 0 invisible para forzar escala
    }]
  };

  // Datos para submission rates
  const submissionValues = filteredCourses.map(c => 
    Math.round((c.period_submission_rate || c.global_submission_rate || 0) * 100)
  );

  // Submission rates bar chart - FORZAR que inicie en 0  
  const submissionData = {
    labels: filteredCourses.map(c => c.course_name.substring(0, 8)),
    datasets: [{
      data: [...submissionValues, 0] // 🎯 Agregar 0 invisible para forzar escala
    }]
  };

  // Trend line chart (first course with data)
  const courseWithTrend = filteredCourses.find(c => 
    c.statistics_for_dates?.length > 1
  );
  
  const trendData = courseWithTrend ? {
    labels: courseWithTrend.statistics_for_dates.map(item => {
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [{
      data: courseWithTrend.statistics_for_dates.map(item => item.average_grade || 0),
      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
      strokeWidth: 2
    }]
  } : null;

  return { gradeData, submissionData, trendData };
};

  // Date picker handlers
  const onStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate && selectedDate <= endDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate && selectedDate >= startDate) {
      setEndDate(selectedDate);
    }
  };

  // PDF Export
  const handleExportPDF = async () => {
    const globalStats = getGlobalStats();
    const { gradeData, submissionData } = getChartData();

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .stats { background: #f0f8ff; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .metric { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Teacher Statistics Report</h1>
            <p>Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}</p>
          </div>
          
          <div class="stats">
            <h2>📈 Performance Summary</h2>
            <div class="metric"><strong>Average Grade:</strong> ${globalStats?.averageGrade || 'N/A'}</div>
            <div class="metric"><strong>Submission Rate:</strong> ${globalStats?.submissionRate || 'N/A'}%</div>
            <div class="metric"><strong>Active Courses:</strong> ${globalStats?.activeCourses || 0} / ${globalStats?.totalCourses || 0}</div>
          </div>

          <h2>📊 Course Performance</h2>
          ${gradeData.labels.map((label, i) => `
            <div style="margin: 10px 0; padding: 10px; border: 1px solid #ddd;">
              <strong>${label}:</strong> Grade ${gradeData.datasets[0].data[i]} | 
              Submission Rate ${submissionData.datasets[0].data[i]}%
            </div>
          `).join('')}
        </body>
      </html>
    `;

    try {
      const { base64 } = await Print.printToFileAsync({
        html: htmlContent,
        base64: true
      });

      const fileName = `teacher_stats_${startDate.getFullYear()}-${startDate.getMonth() + 1}-${startDate.getDate()}.pdf`;
      await downloadAndShareFile({ name: fileName, content: base64 });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  const globalStats = getGlobalStats();
  const { gradeData, submissionData, trendData } = getChartData();
  const screenWidth = Dimensions.get('window').width;

  if (!globalStats) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noDataText}>No statistics available</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📊 Teacher Statistics</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchStatistics}>
          <Text style={styles.refreshText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Global Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>📈 Performance Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{globalStats.averageGrade}</Text>
            <Text style={styles.statLabel}>Avg Grade</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{globalStats.submissionRate}%</Text>
            <Text style={styles.statLabel}>Completion Rate</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{globalStats.activeCourses}</Text>
            <Text style={styles.statLabel}>Active Courses</Text>
          </View>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.sectionTitle}>🔍 Filters</Text>
        
        {/* Course Filter */}
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowCourseModal(true)}>
          <Text style={styles.filterText}>
            📚 {selectedCourse === 'all' ? 'All Courses' : 
                statistics.find(c => c.course_id.toString() === selectedCourse)?.course_name || 'Select Course'}
          </Text>
        </TouchableOpacity>

        {/* Date Filters */}
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartDatePicker(true)}>
            <Text style={styles.dateText}>From: {startDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndDatePicker(true)}>
            <Text style={styles.dateText}>To: {endDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Charts */}
      <View style={styles.chartsContainer}>
        {/* Average Grades Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>📊 Average Grades by Course</Text>
          <BarChart
            data={gradeData}
            width={screenWidth - 40}
            height={200}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </View>

        {/* Submission Rates Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>📈 Task Completion Rates (%)</Text>
          <BarChart
            data={submissionData}
            width={screenWidth - 40}
            height={200}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </View>

        {/* Trend Chart */}
        {trendData && (
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>📈 Performance Trends</Text>
            <LineChart
              data={trendData}
              width={screenWidth - 40}
              height={200}
              chartConfig={chartConfig}
              style={styles.chart}
              bezier
            />
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
          <Text style={styles.buttonText}>📄 Export PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Course Selection Modal */}
      <Modal visible={showCourseModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Course</Text>
            <FlatList
              data={[{ course_id: 'all', course_name: 'All Courses' }, ...statistics]}
              keyExtractor={(item) => item.course_id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.courseOption, 
                    selectedCourse === item.course_id.toString() && styles.selectedCourse]}
                  onPress={() => {
                    setSelectedCourse(item.course_id.toString());
                    setShowCourseModal(false);
                  }}
                >
                  <Text style={styles.courseOptionText}>{item.course_name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.button} onPress={() => setShowCourseModal(false)}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={onStartDateChange}
          maximumDate={endDate}
        />
      )}
      
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={onEndDateChange}
          minimumDate={startDate}
          maximumDate={new Date()}
        />
      )}
    </ScrollView>
  );
};

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.6,
  fromZero: true,
  segments: 4, // 🎯 Divide la escala en 4 segmentos
  formatYLabel: (yValue) => Math.round(yValue).toString(), // 🎯 Muestra números enteros
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  refreshText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButton: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 10,
  },
  filterText: {
    fontSize: 14,
    color: '#333',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateButton: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    flex: 0.48,
  },
  dateText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  chartsContainer: {
    paddingHorizontal: 15,
  },
  chartSection: {
    backgroundColor: '#fff',
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  chart: {
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 15,
  },
  exportButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '80%',
    maxHeight: '70%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  courseOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedCourse: {
    backgroundColor: '#e3f2fd',
  },
  courseOptionText: {
    fontSize: 14,
    color: '#333',
  },
});

export default TeacherStatistics;