import React, { useState, useEffect, useRef } from 'react';
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
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const gradeChartRef = useRef();
  const submissionChartRef = useRef();
  const trendChartRef = useRef();

  useEffect(() => {
    fetchStatistics(true);

    const interval = setInterval(() => {
      fetchStatistics(false);
    }, 30000);

    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        fetchStatistics(false);
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
      if (showLoading) setLoading(true);

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

      // Solo actualizar si cambió algo
      if (JSON.stringify(newStats) !== JSON.stringify(statistics)) {
        setStatistics(newStats);
      }
    } catch (error) {
      if (showLoading) {
        Alert.alert('Error', 'Failed to load statistics');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Función simplificada para filtrar datos por fecha
  const filterByDate = (dataArray) => {
    return dataArray.filter(item => {
      const date = new Date(item.date);
      return date >= startDate && date <= endDate;
    });
  };

  // Función para obtener cursos filtrados
  const getFilteredCourses = () => {
    if (selectedCourse === 'all') {
      return statistics;
    }
    return statistics.filter(course => course.course_id.toString() === selectedCourse);
  };

  // Calcular estadísticas globales simplificado
  const getGlobalStats = () => {
    if (selectedCourse === 'all') {
      // Para "All Courses": usar datos globales sin filtros de fecha
      if (statistics.length === 0) return null;

      // Solo cursos con calificaciones > 0
      const activeCourses = statistics.filter(c => (c.global_average_grade || 0) > 0);
      
      // Solo cursos con submission rate > 0 (cursos que tienen actividad real)
      const coursesWithActivity = statistics.filter(c => (c.global_submission_rate || 0) > 0);
      
      if (activeCourses.length === 0 && coursesWithActivity.length === 0) return null;

      const avgGrade = activeCourses.length > 0 ? 
        activeCourses.reduce((sum, c) => sum + (c.global_average_grade || 0), 0) / activeCourses.length : 0;
      
      // Solo calcular submission rate de cursos que tienen actividad real
      const avgSubmissionRate = coursesWithActivity.length > 0 ? 
        coursesWithActivity.reduce((sum, c) => sum + (c.global_submission_rate || 0), 0) / coursesWithActivity.length : 0;

      return {
        averageGrade: avgGrade.toFixed(1),
        submissionRate: (avgSubmissionRate * 100).toFixed(1),
        activeCourses: Math.max(activeCourses.length, coursesWithActivity.length),
        totalCourses: statistics.length,
      };
    } else {
      // Para curso específico: usar filtros de fecha
      const course = statistics.find(c => c.course_id.toString() === selectedCourse);
      if (!course) return null;

      const filteredDates = (course.statistics_for_dates || []).filter(item => {
        const date = new Date(item.date);
        return date >= startDate && date <= endDate;
      });

      let avgGrade, avgSubmissionRate;

      if (filteredDates.length > 0) {
        // Usar datos filtrados por fecha
        const validGrades = filteredDates.filter(d => d.average_grade > 0);
        avgGrade = validGrades.length > 0 ? 
          validGrades.reduce((sum, d) => sum + d.average_grade, 0) / validGrades.length : 0;
        avgSubmissionRate = filteredDates.reduce((sum, d) => sum + (d.submission_rate || 0), 0) / filteredDates.length;
      } else {
        // Usar datos globales del curso
        avgGrade = course.global_average_grade || 0;
        avgSubmissionRate = course.global_submission_rate || 0;
      }

      return {
        averageGrade: avgGrade.toFixed(1),
        submissionRate: (avgSubmissionRate * 100).toFixed(1),
        activeCourses: 1,
        totalCourses: 1,
      };
    }
  };

  // Generar datos para gráficos simplificado
  const getChartData = () => {
    const courses = getFilteredCourses();

    if (selectedCourse === 'all') {
      // PARA ALL COURSES: Mostrar evolución temporal del promedio de todos los cursos
      
      // Obtener todas las fechas únicas de todos los cursos
      const allDates = new Set();
      courses.forEach(course => {
        const filteredDates = filterByDate(course.statistics_for_dates || []);
        filteredDates.forEach(stat => {
          const date = new Date(stat.date);
          allDates.add(date.toISOString().split('T')[0]); // YYYY-MM-DD
        });
      });

      const sortedDates = Array.from(allDates).sort();

      if (sortedDates.length === 0) {
        // Sin datos temporales, usar datos globales
        const gradeData = {
          labels: ['Today'],
          datasets: [{ data: [0] }] // Empezar desde 0
        };

        const submissionData = {
          labels: ['Today'],
          datasets: [{ data: [0] }] // Empezar desde 0
        };

        return { gradeData, submissionData, trendData: null };
      }

      // Mostrar evolución temporal promedio de todos los cursos
      const labels = sortedDates.map(dateStr => {
        const d = new Date(dateStr);
        return `${d.getDate()}/${d.getMonth() + 1}`;
      });

      const gradeData = {
        labels,
        datasets: [{
          data: sortedDates.map(currentDateStr => {
            let totalGrade = 0;
            let gradeCount = 0;

            courses.forEach(course => {
              const filteredDates = filterByDate(course.statistics_for_dates || []);
              const statsForDate = filteredDates.filter(stat => {
                const statDate = new Date(stat.date);
                return statDate.toISOString().split('T')[0] === currentDateStr;
              });
              
              if (statsForDate.length > 0) {
                const latestStat = statsForDate[statsForDate.length - 1];
                // NO contar grades = 0
                if (latestStat.average_grade > 0) {
                  totalGrade += latestStat.average_grade;
                  gradeCount++;
                }
              }
            });

            return gradeCount > 0 ? totalGrade / gradeCount : 0;
          })
        }]
      };

      const submissionData = {
        labels,
        datasets: [{
          data: sortedDates.map(currentDateStr => {
            let totalSubmissionRate = 0;
            let submissionCount = 0;

            courses.forEach(course => {
              const filteredDates = filterByDate(course.statistics_for_dates || []);
              const statsForDate = filteredDates.filter(stat => {
                const statDate = new Date(stat.date);
                return statDate.toISOString().split('T')[0] === currentDateStr;
              });
              
              if (statsForDate.length > 0) {
                const latestStat = statsForDate[statsForDate.length - 1];
                // Los datos ya vienen en decimal (0-1), multiplicar por 100 para porcentaje
                totalSubmissionRate += (latestStat.submission_rate || 0) * 100;
                submissionCount++;
              }
            });

            return submissionCount > 0 ? totalSubmissionRate / submissionCount : 0;
          })
        }]
      };

      return { gradeData, submissionData, trendData: null };

    } else {
      // PARA CURSO ESPECÍFICO: Mostrar evolución temporal del curso
      const course = courses[0];
      if (!course) return { gradeData: null, submissionData: null, trendData: null };

      const filteredDates = filterByDate(course.statistics_for_dates || []);
      
      if (filteredDates.length === 0) {
        // Sin datos temporales, mostrar con fechas
        const gradeData = {
          labels: ['Today'],
          datasets: [{ data: [course.global_average_grade > 0 ? course.global_average_grade : 0] }]
        };

        const submissionData = {
          labels: ['Today'],
          datasets: [{ data: [(course.global_submission_rate || 0) * 100] }]
        };

        return { gradeData, submissionData, trendData: null };
      }

      // Ordenar por fecha
      const sortedDates = filteredDates.sort((a, b) => new Date(a.date) - new Date(b.date));

      const labels = sortedDates.map(item => {
        const date = new Date(item.date);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      });

      const gradeData = {
        labels,
        datasets: [{ data: sortedDates.map(item => item.average_grade || 0) }]
      };

      const submissionData = {
        labels,
        datasets: [{ data: sortedDates.map(item => (item.submission_rate || 0) * 100) }]
      };

      const trendData = sortedDates.length > 1 ? {
        labels,
        datasets: [{
          data: sortedDates.map(item => item.average_grade || 0),
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

  // PDF Export simplificado
  const handleExportPDF = async () => {
    setGeneratingPDF(true);

    try {
      const globalStats = getGlobalStats();

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
        if (submissionChartRef.current) {
          submissionChartImage = await captureRef(submissionChartRef, {
            format: 'png',
            quality: 0.8,
            result: 'base64'
          });
        }
        if (trendChartRef.current) {
          trendChartImage = await captureRef(trendChartRef, {
            format: 'png',
            quality: 0.8,
            result: 'base64'
          });
        }
      } catch (error) {
        console.log('Error capturing charts:', error);
      }

      const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; }
            .header { text-align: center; border-bottom: 3px solid #007AFF; padding: 20px; margin-bottom: 30px; }
            .stats { background: #f0f8ff; padding: 20px; margin: 20px 0; border-radius: 10px; }
            .metric { margin: 15px 0; padding: 10px; background: white; border-radius: 5px; display: flex; justify-content: space-between; }
            .chart-section { margin: 30px 0; page-break-inside: avoid; }
            .chart-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; }
            .chart-image { width: 100%; max-width: 600px; height: auto; border: 1px solid #ddd; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Teacher Statistics Report</h1>
            <p>Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <div class="stats">
            <h2>📈 Performance Summary</h2>
            <div class="metric"><span>Average Grade:</span><span>${globalStats?.averageGrade || 'N/A'}</span></div>
            <div class="metric"><span>Submission Rate:</span><span>${globalStats?.submissionRate || 'N/A'}%</span></div>
            <div class="metric"><span>Active Courses:</span><span>${globalStats?.activeCourses || 0}</span></div>
            <div class="metric"><span>Period:</span><span>${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}</span></div>
          </div>

          ${gradeChartImage ? `
            <div class="chart-section">
              <h2 class="chart-title">📊 Average Grades</h2>
              <img src="data:image/png;base64,${gradeChartImage}" class="chart-image" />
            </div>
          ` : ''}

          ${submissionChartImage ? `
            <div class="chart-section">
              <h2 class="chart-title">📈 Task Completion Rates</h2>
              <img src="data:image/png;base64,${submissionChartImage}" class="chart-image" />
            </div>
          ` : ''}

          ${trendChartImage ? `
            <div class="chart-section">
              <h2 class="chart-title">📈 Performance Trends</h2>
              <img src="data:image/png;base64,${trendChartImage}" class="chart-image" />
            </div>
          ` : ''}
        </body>
      </html>`;

      const { base64 } = await Print.printToFileAsync({
        html: htmlContent,
        base64: true,
      });

      const fileName = `teacher_stats_${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')}.pdf`;

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
        <TouchableOpacity style={styles.refreshButton} onPress={() => fetchStatistics(true)}>
          <Text style={styles.refreshText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Global Stats - Solo mostrar en "All Courses" */}
      {selectedCourse === 'all' && (
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
      )}

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

        {/* Date Filters - Solo mostrar cuando NO sea "all courses" */}
        {selectedCourse !== 'all' && (
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartDatePicker(true)}>
              <Text style={styles.dateText}>From: {startDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndDatePicker(true)}>
              <Text style={styles.dateText}>To: {endDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Charts */}
      {gradeData && (
        <View style={styles.chartsContainer}>
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>📊 Average Grades</Text>
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

          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>📈 Task Completion (%)</Text>
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

          {trendData && (
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>📈 Grade Trends</Text>
              <View ref={trendChartRef}>
                <LineChart
                  data={trendData}
                  width={screenWidth - 40}
                  height={200}
                  chartConfig={chartConfig}
                  style={styles.chart}
                />
              </View>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={selectedCourse !== 'all' ? styles.buttonContainerThree : styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.exportButton, generatingPDF && { backgroundColor: '#6c757d' }]}
          onPress={handleExportPDF}
          disabled={generatingPDF}
        >
          {generatingPDF ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>📄 Export</Text>
          )}
        </TouchableOpacity>

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
            <Text style={styles.buttonText}>👥 Students</Text>
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

      {/* Date Pickers - Solo mostrar cuando NO sea "all courses" */}
      {selectedCourse !== 'all' && showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={onStartDateChange}
          maximumDate={endDate}
        />
      )}

      {selectedCourse !== 'all' && showEndDatePicker && (
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
  fromZero: true, // Asegurar que empiece desde 0
  segments: 5, // Más segmentos para mejor escala
  formatYLabel: (yValue) => {
    // Formatear los valores para que se vean bien
    if (yValue >= 1000) {
      return Math.round(yValue).toString();
    }
    return parseFloat(yValue).toFixed(1);
  },
  decimalPlaces: 1, // Permitir 1 decimal para mejor precisión
  propsForDots: {
    r: '0'
  },
  // Configuraciones adicionales para mejor visualización
  propsForBackgroundLines: {
    strokeDasharray: '', // Líneas sólidas
    stroke: '#e3e3e3',
    strokeWidth: 1
  },
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
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshText: {
    color: 'white',
    fontSize: 16,
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
  buttonContainerThree: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 15,
  },
  exportButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    flex: 0.3,
    alignItems: 'center',
  },
  individualStatsButton: {
    backgroundColor: '#22CAEC',
    padding: 15,
    borderRadius: 8,
    flex: 0.3,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 8,
    flex: 0.3,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
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