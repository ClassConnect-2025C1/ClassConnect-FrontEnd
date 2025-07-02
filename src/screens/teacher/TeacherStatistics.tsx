// @ts-nocheck

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
import { downloadAndShareFile } from '../../utils/FileDowloader';
import { AppState } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { useRoute } from '@react-navigation/native';


const TeacherStatistics = () => {
  const navigation = useNavigation();
  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [globalChartWidth, setGlobalChartWidth] = useState(0);
  const [chartWidth, setChartWidth] = useState(0);
  const route = useRoute();
  const { courses } = route.params || {};

  // Date filters
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  );
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const { token } = useAuth();
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const globalChartRef = useRef(null);
  const gradeChartRef = useRef(null);
  const submissionChartRef = useRef(null);
  const trendChartRef = useRef(null);
  const courseChartRef = useRef(null);
  const courseChartCaptureRef = useRef(null);
  const gradeChartCaptureRef = useRef(null);
  const submissionChartCaptureRef = useRef(null);

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

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      clearInterval(interval);
      subscription?.remove();
    };
  }, [selectedCourse]); // Agregar selectedCourse como dependencia

  const dynamicChartWidth = (labelsCount: number, minWidth: number) =>
    Math.max(minWidth, labelsCount * 60);   // 60 = ~1 bar+gap

  const fetchStatistics = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);

      let endpoint;

      if (selectedCourse === 'all') {
        endpoint = `${API_URL}/api/courses/statistics/global`;
      } else {
        endpoint = `${API_URL}/api/courses/statistics/${selectedCourse}`;
      }


      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });


      if (!response.ok) throw new Error('Failed to fetch statistics');

      const data = await response.json();
      console.log('Data received:', data);

      // Los datos ya vienen filtrados del backend
      if (JSON.stringify(data) !== JSON.stringify(statistics)) {
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.log('Error details:', error); // 👈 Y AQUÍ
      if (showLoading) {
        Alert.alert('Error', 'Failed to load statistics');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };



  const getGlobalStats = () => {
    if (selectedCourse === 'all') {
      return {
        averageGrade: (statistics.global_average_grade || 0).toFixed(1),
        submissionRate: ((statistics.global_submission_rate || 0) * 100).toFixed(1),
        activeCourses: courses?.length || 0,  // Usar los cursos pasados como parámetro
        totalCourses: courses?.length || 0,
      };
    } else {
      return {
        averageGrade: (statistics.global_average_grade || 0).toFixed(1),
        submissionRate: ((statistics.global_submission_rate || 0) * 100).toFixed(1),
        activeCourses: 1,
        totalCourses: 1,
      };
    }
  };

  const getGlobalChartData = (stats) => {
    if (!stats) return null;

    const avgGrade = parseFloat(stats.averageGrade) * 10;
    const submissionRate = parseFloat(stats.submissionRate);

    return {
      labels: ['Avg Grade', 'Completion %'],
      datasets: [
        {
          data: [avgGrade, submissionRate],
        },
      ],
    };
  };


  const getLastGradeTendencyForCourse = (courseId) => {
    // Ahora puedes usar statistics directamente ya que viene del backend para el curso específico
    if (!statistics || !statistics.last_10_assignments_average_grade_tendency) {
      return "Unknown";
    }
    return statistics.last_10_assignments_average_grade_tendency;
  }

  const getLastSubmissionRateTendencyForCourse = (courseId) => {
    if (!statistics || !statistics.last_10_assignments_submission_rate_tendency) {
      return "Unknown";
    }
    return statistics.last_10_assignments_submission_rate_tendency;
  }

  const getSuggestionsForCourse = (courseId) => {
    if (!statistics || !statistics.suggestions) {
      return "";
    }
    return statistics.suggestions;
  }

  const getTendencyStyle = (tendency) => {
    const upperTendency = tendency.toUpperCase();

    switch (upperTendency) {
      case 'CRESCENT':
        return { color: '#28a745', fontWeight: 'bold' }; // Green
      case 'DECRESCENT':
        return { color: '#dc3545', fontWeight: 'bold' }; // Red
      case 'STABLE':
        return { color: '#007AFF', fontWeight: 'bold' }; // Blue
      default:
        return { color: '#333', fontWeight: 'normal' }; // Default
    }
  };

  const getChartData = () => {
    if (selectedCourse === 'all') {
      // Los datos de cursos ya vienen del backend

      const courseData = (statistics.courseData || []).slice(0, 6).map((course) => ({
        name: course.course_name.substring(0, 8),
        grade: course.average_grade || 0,
        submission: (course.submission_rate || 0) * 100,
      }));

      if (courseData.length === 0) {
        return { gradeData: null, submissionData: null, trendData: null };
      }

      const gradeData = {
        labels: courseData.map((c) => c.name),
        datasets: [{ data: courseData.map((c) => c.grade) }],
      };

      const submissionData = {
        labels: courseData.map((c) => c.name),
        datasets: [{ data: courseData.map((c) => c.submission) }],
      };

      return { gradeData, submissionData, trendData: null };
    } else {
      // Los datos temporales ya vienen filtrados del backend
      const timelineData = statistics.timelineData || [];

      if (timelineData.length === 0) {
        return { gradeData: null, submissionData: null, trendData: null };
      }

      const labels = timelineData.map((item) => {
        const date = new Date(item.date);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      });

      const gradeData = {
        labels,
        datasets: [{ data: timelineData.map(d => d.average_grade || 0) }],
      };

      const submissionData = {
        labels,
        datasets: [{ data: timelineData.map(d => (d.submission_rate || 0) * 100) }],
      };

      const trendData = timelineData.length > 1 ? {
        labels,
        datasets: [{
          data: timelineData.map((item) => item.average_grade || 0),
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          strokeWidth: 2,
        }],
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

  const handleExportPDF = async () => {
    setGeneratingPDF(true);

    try {
      const gradeTendency = getLastGradeTendencyForCourse(selectedCourse);
      const completionTendency = getLastSubmissionRateTendencyForCourse(selectedCourse);
      const aiSuggestions = getSuggestionsForCourse(selectedCourse);

      const tendencyColor = (t: string) => {
        switch ((t || '').toUpperCase()) {
          case 'CRESCENT': return '#28a745';  // green
          case 'DECRESCENT': return '#dc3545';  // red
          case 'STABLE': return '#007AFF';  // blue
          default: return '#333';     // fallback
        }
      };

      const globalStats = getGlobalStats();
      const { gradeData, submissionData, trendData } = getChartData();

      await new Promise((resolve) => setTimeout(resolve, 2000));

      let courseChartImage = '';
      let gradeChartImage = '';
      let submissionChartImage = '';

      try {
        if (gradeChartCaptureRef.current) {
          gradeChartImage = await captureRef(gradeChartCaptureRef.current, {
            format: 'png',
            quality: 0.8,
            result: 'base64',
          });
        }

        if (submissionChartCaptureRef.current) {
          submissionChartImage = await captureRef(submissionChartCaptureRef.current, {
            format: 'png',
            quality: 0.8,
            result: 'base64',
          });
        }
      } catch (error) { }

      const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; background: white; }
          .header { text-align: center; border-bottom: 3px solid #007AFF; padding: 20px; margin-bottom: 30px; }
          .stats { background: #f0f8ff; padding: 20px; margin: 20px 0; border-radius: 10px; }
          .metric { margin: 15px 0; padding: 10px; background: white; border-radius: 5px; display: flex; justify-content: space-between; border: 1px solid #ddd; }
          .chart-section { margin: 30px 0; page-break-inside: avoid; text-align: center; }
          .chart-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #007AFF; }
          .chart-image { width: 100%; max-width: 600px; height: auto; border: 1px solid #ddd; border-radius: 8px; margin: 10px auto; display: block; }
          h1 { color: #007AFF; }
          h2 { color: #333; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Teacher Statistics Report</h1>
          <p>Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p>Course: ${selectedCourse === 'all'
          ? 'All Courses'
          : courses.find(c => c.id.toString() === selectedCourse)?.title || 'Selected Course'
        }</p>
        </div>
        
        <div class="stats">
          <h2>📈 Performance Summary</h2>
          <div class="metric"><span><strong>Average Grade:</strong></span><span>${globalStats?.averageGrade || 'N/A'}</span></div>
          <div class="metric"><span><strong>Submission Rate:</strong></span><span>${globalStats?.submissionRate || 'N/A'}%</span></div>
          <div class="metric"><span><strong>Active Courses:</strong></span><span>${globalStats?.activeCourses || 0}</span></div>
          <div class="metric"><span><strong>Period:</strong></span><span>${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}</span></div>
        </div>

        ${selectedCourse !== 'all' ? `
          <div class="stats">
            <h2>📈 Last 10 Assignments – Tendencies & AI tips</h2>

            <div class="metric">
              <span><strong>Grade tendency:</strong></span>
              <span style="color:${tendencyColor(gradeTendency)}">
                ${gradeTendency.toUpperCase()}
              </span>
            </div>

            <div class="metric">
              <span><strong>Completion tendency:</strong></span>
              <span style="color:${tendencyColor(completionTendency)}">
                ${completionTendency.toUpperCase()}
              </span>
            </div>

            <div class="metric">
              <span><strong>AI suggestions:</strong></span>
              <span>${aiSuggestions || '—'}</span>
            </div>
          </div>
        ` : ''}

        ${gradeChartImage ? `
          <div class="chart-section">
            <h2 class="chart-title">📈 Average grades</h2>
            <img src="data:image/png;base64,${gradeChartImage}"
                class="chart-image" alt="Grade timeline"/>
          </div>` : ''}

        ${submissionChartImage ? `
          <div class="chart-section">
            <h2 class="chart-title">📈 Completion rates</h2>
            <img src="data:image/png;base64,${submissionChartImage}"
                class="chart-image" alt="Completion timeline"/>
          </div>` : ''}

        <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
          <p>Generated by Teacher Statistics App</p>
        </div>
      </body>
    </html>`;

      const fileName = `teacher_stats_${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')}.pdf`;

      // Configuración del PDF
      const options = {
        html: htmlContent,
        fileName: fileName,
        directory: 'Documents',
        base64: true,
        width: 612,
        height: 792,
        padding: 24,
        bgColor: '#FFFFFF',
      };

      const pdf = await RNHTMLtoPDF.convert(options);

      await downloadAndShareFile({
        name: fileName,
        content: pdf.base64,
      });


    } catch (error) {
      console.error('PDF Export Error:', error);
      Alert.alert(
        'Error',
        `Failed to generate PDF: ${error.message || 'Unknown error'}`,
      );
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
  const globalChartData = getGlobalChartData(globalStats);
  const globalChartDataForCourse = selectedCourse !== 'all' ? getGlobalChartData(getGlobalStats()) : null;
  const { gradeData, submissionData, trendData } = getChartData();
  const screenWidth = Dimensions.get('window').width;

  if (!globalStats) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noDataText}>No statistics available</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
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
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => fetchStatistics(true)}
        >
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>📈 Performance Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{globalStats.averageGrade}</Text>
            <Text style={styles.statLabel}>Avg Grade</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {globalStats.submissionRate}%
            </Text>
            <Text style={styles.statLabel}>Completion Rate</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{globalStats.activeCourses}</Text>
            <Text style={styles.statLabel}>Active Courses</Text>
          </View>
        </View>

        {selectedCourse === 'all' && globalChartData && (
          <View
            style={styles.chartComponent}
            onLayout={e => {
              const { width } = e.nativeEvent.layout;
              setChartWidth(width);
            }}
          >
            <View
              ref={globalChartRef}
              collapsable={false}
              style={{ backgroundColor: 'white' }}
            >
              <BarChart
                data={globalChartData}
                width={chartWidth}
                height={200}
                fromZero
                yAxisMin={0}
                yAxisMax={100}
                chartConfig={chartConfig}
              />
            </View>
          </View>
        )}

        {selectedCourse !== 'all' && globalChartDataForCourse && (
          <View
            style={styles.chartComponent}
            onLayout={e => {
              setChartWidth(e.nativeEvent.layout.width);
            }}
          >
            <View
              ref={courseChartRef}
              collapsable={false}
              style={{ backgroundColor: 'white' }}
            >
              <BarChart
                data={globalChartDataForCourse}
                width={chartWidth || 1}
                height={200}
                fromZero
                yAxisMin={0}
                yAxisMax={100}
                chartConfig={chartConfig}
              />
            </View>
          </View>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.sectionTitle}>🔍 Filters</Text>

        {/* Course Filter */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowCourseModal(true)}
        >
          <Text style={styles.filterText}>
            📚{' '}
            {selectedCourse === 'all'
              ? 'All Courses'
              : courses.find(
                (c) => c.id.toString() === selectedCourse,
              )?.title || 'Select Course'}
          </Text>
        </TouchableOpacity>

        {/* Course Last Tendency */}
        {selectedCourse !== 'all' && (
          <View>
            <Text style={styles.tendencyTitle}>📈 Last 10 Assignments Tendency</Text>
            <View style={styles.tendencyRow}>
              <Text style={styles.tendencyLabel}>Grade tendency:</Text>
              <Text style={styles.tendencyBody, getTendencyStyle(getLastGradeTendencyForCourse(selectedCourse))}>{getLastGradeTendencyForCourse(selectedCourse).toUpperCase()}</Text>
            </View>
            <View style={styles.tendencyRow}>
              <Text style={styles.tendencyLabel}>Task completion tendency:</Text>
              <Text style={styles.tendencyBody, getTendencyStyle(getLastSubmissionRateTendencyForCourse(selectedCourse))}>  {getLastSubmissionRateTendencyForCourse(selectedCourse).toUpperCase()}</Text>
            </View>
            <View style={styles.tendencyRow}>
              <Text style={styles.suggestionLabel}>AI suggestions:</Text>
              <Text style={styles.tendencyBody}>{getSuggestionsForCourse(selectedCourse)}</Text>
            </View>
          </View>
        )}

        {/* Date Filters - Solo mostrar cuando NO sea "all courses" */}
        {selectedCourse !== 'all' && (
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={styles.dateText}>
                From: {startDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={styles.dateText}>
                To: {endDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Charts */}
      {gradeData && (
        <View style={styles.chartsContainer}>
          <View style={styles.chartSection}>
            {selectedCourse === 'all' && (
              <Text style={styles.chartTitle}>📊 Average Grade per course</Text>
            )}
            {selectedCourse !== 'all' && (
              <Text style={styles.chartTitle}>📊 Average Grade per date</Text>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View
                ref={gradeChartRef}
                collapsable={false}
                style={{ backgroundColor: 'white' }}
              >
                <BarChart
                  data={gradeData}
                  width={dynamicChartWidth(gradeData.labels.length, screenWidth - 40)}
                  height={200}
                  fromZero
                  yAxisMin={0}
                  yAxisMax={100}
                  chartConfig={chartConfig}
                  style={styles.chart}
                />
              </View>
              {/* hidden replica used only for PDF */}
              <View
                style={{ position: 'absolute', left: -9999 }}   // keeps it off-screen
                ref={gradeChartCaptureRef}
                collapsable={false}>
                <BarChart
                  data={gradeData}
                  width={dynamicChartWidth(gradeData.labels.length, screenWidth - 40)}
                  height={200}
                  fromZero
                  chartConfig={chartConfig}
                />
              </View>
            </ScrollView>
          </View>

          <View style={styles.chartSection}>
            {selectedCourse === 'all' && (
              <Text style={styles.chartTitle}>📈 Task Completion (%) per course</Text>
            )}
            {selectedCourse !== 'all' && (
              <Text style={styles.chartTitle}> Task Completion (%) per date</Text>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View
                ref={submissionChartRef}
                collapsable={false}
                style={{ backgroundColor: 'white' }}
              >
                <BarChart
                  data={submissionData}
                  width={dynamicChartWidth(gradeData.labels.length, screenWidth - 40)}
                  height={200}
                  fromZero
                  yAxisMin={0}
                  yAxisMax={100}
                  chartConfig={chartConfig}
                  style={styles.chart}
                />
              </View>
              {/* hidden replica used only for PDF */}
              <View
                style={{ position: 'absolute', left: -9999 }}   // keeps it off-screen
                ref={submissionChartCaptureRef}
                collapsable={false}>
                <BarChart
                  data={submissionData}
                  width={dynamicChartWidth(gradeData.labels.length, screenWidth - 40)}
                  height={200}
                  fromZero
                  chartConfig={chartConfig}
                />
              </View>
            </ScrollView>
          </View>

        </View>
      )}

      {/* Action Buttons */}
      <View
        style={
          selectedCourse !== 'all'
            ? styles.buttonContainerThree
            : styles.buttonContainer
        }
      >
        <TouchableOpacity
          style={[
            styles.exportButton,
            generatingPDF,
          ]}
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
              const foundCourse = courses.find(
                (c) => c.id.toString() === selectedCourse,
              );

              if (foundCourse) {
                navigation.navigate('TeacherMembersCourse', { course: foundCourse });
              }
            }}
          >
            <Text style={styles.buttonText}>👥 Students</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Course Selection Modal */}
      <Modal visible={showCourseModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Course</Text>
            <FlatList
              data={[
                { id: 'all', title: 'All Courses' },
                ...courses,
              ]}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.courseOption,
                    selectedCourse === item.id.toString() &&
                    styles.selectedCourse,
                  ]}
                  onPress={() => {
                    setSelectedCourse(item.id.toString());
                    setShowCourseModal(false);
                  }}
                >
                  <Text style={styles.courseOptionText}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={{
                backgroundColor: '#6c757d',
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderRadius: 8,
                marginTop: 10,
                alignItems: 'center'
              }}
              onPress={() => setShowCourseModal(false)}
            >
              <Text style={{
                color: '#FFFFFF',
                fontWeight: 'bold',
                fontSize: 16
              }}>
                Close
              </Text>
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
  fromZero: true,
  segments: 5,
  formatYLabel: (yValue) => {
    if (yValue >= 1000) {
      return Math.round(yValue).toString();
    }
    return parseFloat(yValue).toFixed(1);
  },
  decimalPlaces: 1,
  propsForDots: {
    r: '0',
  },

  propsForBackgroundLines: {
    strokeDasharray: '',
    stroke: '#e3e3e3',
    strokeWidth: 1,
  },

  yAxisMinimum: 0,

  fillShadowGradient: 'transparent',
  fillShadowGradientOpacity: 0,

  yAxisMin: 0,
  yAxisMax: 100,
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
    backgroundColor: '#3A59D1',
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
    marginBottom: 0,
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
  tendencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  tendencyRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  tendencyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 160,
  },
  suggestionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 100,
  },
  tendencyBody: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#666',
    flex: 1,
    flexWrap: 'wrap',
    textAlign: 'left',
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
  chartComponent: {
    backgroundColor: '#fff',
    paddingTop: 10,
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
    backgroundColor: '#3A59D1',
    padding: 15,
    borderRadius: 8,
    flex: 0.3,
    alignItems: 'center',
  },
  individualStatsButton: {
    backgroundColor: '#3D90D7',
    padding: 15,
    borderRadius: 8,
    flex: 0.3,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#7AC6D2',
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
