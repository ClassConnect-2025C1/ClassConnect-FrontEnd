import React, { useState, useEffect,useRef } from 'react';
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
import { captureRef } from 'react-native-view-shot';

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
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const gradeChartRef = useRef();
  const submissionChartRef = useRef();
  const trendChartRef = useRef();

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
      console.log("data", data);
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
    const filteredCourses = getFilteredData();

    if (selectedCourse === 'all') {
      // 📊 MODO "ALL COURSES" - Solo una barra con promedio general
      const globalStats = getGlobalStats();

      const gradeData = {
        labels: ['All Courses'],
        datasets: [{
          data: [parseFloat(globalStats?.averageGrade || 0), 0] // Agregar 0 para forzar escala
        }]
      };

      const submissionData = {
        labels: ['All Courses'],
        datasets: [{
          data: [parseFloat(globalStats?.submissionRate || 0), 0] // Agregar 0 para forzar escala
        }]
      };

      // Para trends, usar el curso con más datos
      const allCoursesWithData = filteredCourses.filter(c =>
        c.statistics_for_dates?.length > 1
      );

      const courseWithMostData = allCoursesWithData.sort((a, b) =>
        b.statistics_for_dates.length - a.statistics_for_dates.length
      )[0];

      const trendData = courseWithMostData ? {
        labels: courseWithMostData.statistics_for_dates.map(item => {
          const date = new Date(item.date);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }),
        datasets: [{
          data: courseWithMostData.statistics_for_dates.map(item => item.average_grade || 0),
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          strokeWidth: 2
        }]
      } : null;

      return { gradeData, submissionData, trendData };
    } else {
      // 📊 MODO "CURSO ESPECÍFICO" - Barras por curso como antes
      const specificCourses = filteredCourses.slice(0, 5);

      const gradeValues = specificCourses.map(c => c.period_avg_grade || c.global_average_grade || 0);

      const gradeData = {
        labels: specificCourses.map(c => c.course_name.substring(0, 8)),
        datasets: [{
          data: [...gradeValues, 0]
        }]
      };

      const submissionValues = specificCourses.map(c =>
        Math.round((c.period_submission_rate || c.global_submission_rate || 0) * 100)
      );

      const submissionData = {
        labels: specificCourses.map(c => c.course_name.substring(0, 8)),
        datasets: [{
          data: [...submissionValues, 0]
        }]
      };

      // Trend para curso específico
      const courseWithTrend = specificCourses.find(c =>
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
    }
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
    setGeneratingPDF(true);

    try {
      const globalStats = getGlobalStats();
      const { gradeData, submissionData, trendData } = getChartData();

      // Capturar gráficos como imágenes
      let gradeChartImage = '';
      let submissionChartImage = '';
      let trendChartImage = '';

      try {
        if (gradeChartRef.current) {
          gradeChartImage = await captureRef(gradeChartRef, {
            format: 'png',
            quality: 0.8,
            result: 'base64'
          });
        }
      } catch (error) {
        console.log('Error capturing grade chart:', error);
      }

      try {
        if (submissionChartRef.current) {
          submissionChartImage = await captureRef(submissionChartRef, {
            format: 'png',
            quality: 0.8,
            result: 'base64'
          });
        }
      } catch (error) {
        console.log('Error capturing submission chart:', error);
      }

      try {
        if (trendChartRef.current && trendData) {
          trendChartImage = await captureRef(trendChartRef, {
            format: 'png',
            quality: 0.8,
            result: 'base64'
          });
        }
      } catch (error) {
        console.log('Error capturing trend chart:', error);
      }

      const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; }
            .header { text-align: center; border-bottom: 3px solid #007AFF; padding: 20px; margin-bottom: 30px; background: #f5f7fa; border-radius: 10px; }
            .stats { background: #f0f8ff; padding: 20px; margin: 20px 0; border-radius: 10px; border-left: 5px solid #007AFF; }
            .metric { margin: 15px 0; padding: 10px; background: white; border-radius: 5px; display: flex; justify-content: space-between; }
            .chart-section { margin: 30px 0; page-break-inside: avoid; }
            .chart-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            .chart-image { width: 100%; max-width: 600px; height: auto; border: 1px solid #ddd; border-radius: 8px; margin: 10px 0; }
            .filters-info { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Teacher Statistics Report</h1>
            <p><strong>Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <div class="filters-info">
            <h3>📅 Report Parameters</h3>
            <p><strong>Period:</strong> ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}</p>
            <p><strong>Course Filter:</strong> ${selectedCourse === 'all' ? 'All Courses' :
          statistics.find(c => c.course_id.toString() === selectedCourse)?.course_name || 'Selected Course'}</p>
          </div>
          
          <div class="stats">
            <h2>📈 Performance Summary</h2>
            <div class="metric"><span><strong>Average Grade:</strong></span><span>${globalStats?.averageGrade || 'N/A'}</span></div>
            <div class="metric"><span><strong>Submission Rate:</strong></span><span>${globalStats?.submissionRate || 'N/A'}%</span></div>
            <div class="metric"><span><strong>Active Courses:</strong></span><span>${globalStats?.activeCourses || 0} / ${globalStats?.totalCourses || 0}</span></div>
          </div>

          ${gradeChartImage ? `
            <div class="chart-section">
              <h2 class="chart-title">📊 Average Grades by Course</h2>
              <img src="data:image/png;base64,${gradeChartImage}" class="chart-image" alt="Grade Chart" />
            </div>
          ` : ''}

          ${submissionChartImage ? `
            <div class="chart-section">
              <h2 class="chart-title">📈 Task Completion Rates (%)</h2>
              <img src="data:image/png;base64,${submissionChartImage}" class="chart-image" alt="Submission Chart" />
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
        base64: true,
        width: 612,
        height: 792,
        margins: { left: 20, top: 20, right: 20, bottom: 20 }
      });

      const fileName = `teacher_stats_${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')}.pdf`;

      await downloadAndShareFile({ name: fileName, content: base64 });
      Alert.alert('Success', 'PDF exported successfully!');

    } catch (error) {
      console.error('PDF Export Error:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPDF(false);
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
          <View ref={gradeChartRef}>
            <BarChart
              data={gradeData}
              width={screenWidth - 40}
              height={200}
              chartConfig={chartConfig}
              style={styles.chart}
            />
          </View>
        </View>

        {/* Submission Rates Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>📈 Task Completion Rates (%)</Text>
          <View ref={submissionChartRef}>
            <BarChart
              data={submissionData}
              width={screenWidth - 40}
              height={200}
              chartConfig={chartConfig}
              style={styles.chart}
            />
          </View>
        </View>

        {/* Trend Chart */}
        {trendData && (
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>📈 Performance Trends</Text>
            <View ref={trendChartRef}>
              <LineChart
                data={trendData}
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

      {/* Action Buttons */}
      <View style={selectedCourse !== 'all' ? styles.buttonContainerThree : styles.buttonContainer}>
  <TouchableOpacity
    style={[styles.exportButton, generatingPDF && { backgroundColor: '#6c757d' }]}
    onPress={handleExportPDF}
    disabled={generatingPDF}
  >
    {generatingPDF ? (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#fff" />
        <Text style={[styles.buttonText, { marginLeft: 8 }]}>Generating...</Text>
      </View>
    ) : (
      <Text style={styles.buttonText}>📄 Export </Text>
    )}
  </TouchableOpacity>
  
  {/* NUEVO BOTÓN - Solo aparece cuando hay curso específico */}
  {selectedCourse !== 'all' && (
    <TouchableOpacity 
      style={styles.individualStatsButton} 
      onPress={() => {
        const course = statistics.find(c => c.course_id.toString() === selectedCourse);
        navigation.navigate('StudentIndividualStatistics', { 
          course: { 
            id: selectedCourse, 
            name: course?.course_name || 'Course' 
          } 
        });
      }}
    >
      <Text style={styles.buttonText}>👥 Student</Text>
    </TouchableOpacity>
  )}
  
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
  buttonContainerThree: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  margin: 15,
  flexWrap: 'wrap',
  gap: 8,
},
individualStatsButton: {
  backgroundColor: '#22CAEC',
  padding: 15,
  borderRadius: 8,
  flex: 0.3,
  alignItems: 'center',
},
});

export default TeacherStatistics;