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
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '@env';
import { useAuth } from '../../navigation/AuthContext';

const TeacherStatistics = () => {
  const navigation = useNavigation();
  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('all'); // CA 2: Filtrado por curso
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const { token } = useAuth();

  useEffect(() => {
    fetchStatistics();
    // CA 5: Simulación de actualización automática cada 5 minutos
    const interval = setInterval(fetchStatistics, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/courses/statistics`, {
        method: 'GET',
        headers: {
           'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      
      const data = await response.json();
      console.log('Fetched statistics:', data);
      setStatistics(data.statistics || []);
      setLastUpdated(new Date());
    } catch (error) {
      Alert.alert('Error', 'Failed to load statistics');
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  // CA 1: Cálculo de estadísticas globales
  const getGlobalStatistics = () => {
    if (statistics.length === 0) return null;

    const activeStatistics = statistics.filter(course => 
      course.global_average_grade > 0 || course.global_submission_rate > 0
    );

    const totalGrades = activeStatistics.reduce((sum, course) => 
      sum + (course.global_average_grade || 0), 0
    );
    const avgGrade = activeStatistics.length > 0 ? totalGrades / activeStatistics.length : 0;

    const totalSubmissionRate = activeStatistics.reduce((sum, course) => 
      sum + (course.global_submission_rate || 0), 0
    );
    const avgSubmissionRate = activeStatistics.length > 0 ? 
      (totalSubmissionRate / activeStatistics.length) * 100 : 0;

    const totalCourses = statistics.length;
    const activeCourses = activeStatistics.length;
    const completionRate = totalCourses > 0 ? (activeCourses / totalCourses) * 100 : 0;

    return {
      averageGrade: avgGrade.toFixed(1),
      submissionRate: avgSubmissionRate.toFixed(1),
      totalCourses,
      activeCourses,
      completionRate: completionRate.toFixed(1),
    };
  };

  // CA 2: Filtrado por curso
  const getFilteredStatistics = () => {
    if (selectedCourse === 'all') return statistics;
    return statistics.filter(course => course.course_id.toString() === selectedCourse);
  };

  // CA 4: Datos para gráficos mejorados
  const getChartData = () => {
    const filteredStats = getFilteredStatistics();
    
    // Gráfico de barras - Calificaciones por curso
    const gradeData = {
      labels: filteredStats.slice(0, 6).map(course => 
        course.course_name.length > 8 ? 
        course.course_name.substring(0, 8) + '...' : 
        course.course_name
      ),
      datasets: [{
        data: filteredStats.slice(0, 6).map(course => course.global_average_grade || 0)
      }]
    };

    // Gráfico de líneas - Tendencia temporal (usando el primer curso con datos)
    const courseWithData = filteredStats.find(course => 
      course.statistics_for_dates && course.statistics_for_dates.length > 0
    );
    
    const trendData = courseWithData ? {
      labels: courseWithData.statistics_for_dates.slice(-6).map(item => {
        const date = new Date(item.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
      datasets: [{
        data: courseWithData.statistics_for_dates.slice(-6).map(item => 
          item.average_grade || 0
        ),
        color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
        strokeWidth: 2
      }]
    } : null;

    // Gráfico circular - Distribución de actividad
    const activeCount = filteredStats.filter(course => 
      course.global_submission_rate > 0
    ).length;
    const inactiveCount = filteredStats.length - activeCount;

    const pieData = [
      {
        name: 'Active Courses',
        population: activeCount,
        color: '#36A2EB',
        legendFontColor: '#333',
        legendFontSize: 12,
      },
      {
        name: 'Inactive Courses',
        population: inactiveCount,
        color: '#FF6384',
        legendFontColor: '#333',
        legendFontSize: 12,
      }
    ];

    return { gradeData, trendData, pieData };
  };

  // CA 6: Exportación mejorada
  const handleDownloadPDF = async () => {
    const globalStats = getGlobalStatistics();
    const filteredStats = getFilteredStatistics();
    
    let htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .global-stats { background-color: #f0f8ff; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .course-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .metric { margin: 10px 0; }
            .date { text-align: right; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Teacher Statistics Report</h1>
            <p>Generated on ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', month: 'long', day: 'numeric' 
            })}</p>
          </div>
          
          <div class="global-stats">
            <h2>📈 Global Performance Indicators</h2>
            <div class="metric"><strong>Average Grade Across All Courses:</strong> ${globalStats?.averageGrade || 'N/A'}</div>
            <div class="metric"><strong>Overall Submission Rate:</strong> ${globalStats?.submissionRate || 'N/A'}%</div>
            <div class="metric"><strong>Course Activity Rate:</strong> ${globalStats?.completionRate || 'N/A'}%</div>
            <div class="metric"><strong>Total Courses:</strong> ${globalStats?.totalCourses || 0}</div>
            <div class="metric"><strong>Active Courses:</strong> ${globalStats?.activeCourses || 0}</div>
          </div>

          <h2>📚 Course Details</h2>
    `;
    
    filteredStats.forEach(course => {
      const hasData = course.statistics_for_dates && course.statistics_for_dates.length > 0;
      htmlContent += `
        <div class="course-section">
          <h3>${course.course_name}</h3>
          <div class="metric"><strong>Course ID:</strong> ${course.course_id}</div>
          <div class="metric"><strong>Average Grade:</strong> ${course.global_average_grade || 'N/A'}</div>
          <div class="metric"><strong>Submission Rate:</strong> ${course.global_submission_rate ? 
            Math.round(course.global_submission_rate * 100) + '%' : 'N/A'}</div>
          <div class="metric"><strong>Historical Data Points:</strong> ${hasData ? course.statistics_for_dates.length : 0}</div>
          <div class="metric"><strong>Status:</strong> ${
            (course.global_average_grade > 0 || course.global_submission_rate > 0) ? 
            '✅ Active' : '⚠️ No Activity'
          }</div>
        </div>
      `;
    });

    htmlContent += `
          <div class="date">
            <p><em>Last updated: ${lastUpdated.toLocaleString()}</em></p>
            <p><em>Filter applied: ${selectedCourse === 'all' ? 'All Courses' : 'Selected Course'}</em></p>
          </div>
        </body>
      </html>
    `;

    try {
      const options = {
        html: htmlContent,
        fileName: `teacher_statistics_${new Date().getTime()}`,
        directory: 'Documents',
      };
      const file = await RNHTMLtoPDF.convert(options);
      Alert.alert('Success', `PDF report saved to ${file.filePath}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF report');
    }
  };

  const CourseModal = () => (
    <Modal
      visible={showCourseModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCourseModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Course</Text>
          <FlatList
            data={[{ course_id: 'all', course_name: 'All Courses' }, ...statistics]}
            keyExtractor={(item) => item.course_id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.courseOption,
                  selectedCourse === item.course_id.toString() && styles.selectedCourse
                ]}
                onPress={() => {
                  setSelectedCourse(item.course_id.toString());
                  setShowCourseModal(false);
                }}
              >
                <Text style={styles.courseOptionText}>{item.course_name}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => setShowCourseModal(false)}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#333" />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  const globalStats = getGlobalStatistics();
  const { gradeData, trendData, pieData } = getChartData();
  const screenWidth = Dimensions.get('window').width;

  if (!globalStats) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.noDataText}>No statistics available</Text>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header with Refresh */}
      <View style={styles.header}>
        <Text style={styles.title}>📊 Performance Statistics</Text>
        <View style={styles.headerControls}>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchStatistics}>
            <Text style={styles.refreshText}>🔄 Refresh</Text>
          </TouchableOpacity>
          <Text style={styles.lastUpdated}>
            Updated: {lastUpdated.toLocaleTimeString()}
          </Text>
        </View>
      </View>

      {/* CA 1: Global Statistics Panel */}
      <View style={styles.globalStatsContainer}>
        <Text style={styles.sectionTitle}>📈 Global Performance Indicators</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{globalStats.averageGrade}</Text>
            <Text style={styles.metricLabel}>Avg Grade</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{globalStats.submissionRate}%</Text>
            <Text style={styles.metricLabel}>Submission Rate</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{globalStats.activeCourses}</Text>
            <Text style={styles.metricLabel}>Active Courses</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{globalStats.completionRate}%</Text>
            <Text style={styles.metricLabel}>Activity Rate</Text>
          </View>
        </View>
      </View>

      {/* CA 2: Course Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>📚 Filter by Course:</Text>
        <TouchableOpacity
          style={styles.courseSelector}
          onPress={() => setShowCourseModal(true)}
        >
          <Text style={styles.courseSelectorText}>
            {selectedCourse === 'all' ? 'All Courses' : 
             statistics.find(c => c.course_id.toString() === selectedCourse)?.course_name || 'Select Course'}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* CA 4: Enhanced Charts */}
      <View style={styles.chartsContainer}>
        {/* Grades Bar Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>📊 Average Grades by Course</Text>
          {gradeData.datasets[0].data.some(val => val > 0) ? (
            <BarChart
              data={gradeData}
              width={screenWidth - 40}
              height={220}
              yAxisLabel=""
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars={true}
            />
          ) : (
            <View style={styles.noDataChart}>
              <Text style={styles.noDataText}>No grade data available</Text>
            </View>
          )}
        </View>

        {/* Trend Line Chart */}
        {trendData && (
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>📈 Grade Trends Over Time</Text>
            <LineChart
              data={trendData}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              bezier
            />
          </View>
        )}

        {/* Activity Pie Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>⭕ Course Activity Distribution</Text>
          <PieChart
            data={pieData}
            width={screenWidth - 40}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.exportButton} onPress={handleDownloadPDF}>
          <Text style={styles.buttonText}>📄 Export Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>

      <CourseModal />
    </ScrollView>
  );
};

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.6,
  useShadowColorFromDataset: false,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  refreshText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
  },
  globalStatsContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: '#f8f9fa',
    width: '48%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  filterContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  courseSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  courseSelectorText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownArrow: {
    color: '#666',
  },
  chartsContainer: {
    paddingHorizontal: 15,
  },
  chartSection: {
    backgroundColor: '#fff',
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
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
    marginBottom: 15,
  },
  chart: {
    borderRadius: 8,
  },
  noDataChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
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
  cancelButton: {
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 8,
    flex: 0.48,
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
  closeModalButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
  },
});

export default TeacherStatistics;