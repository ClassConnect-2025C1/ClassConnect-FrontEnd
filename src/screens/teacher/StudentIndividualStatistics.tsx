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
  Platform,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { API_URL } from '@env';
import { useAuth } from '../../navigation/AuthContext';
import { downloadAndShareFile } from '../../utils/FileDowloader';
import { AppState } from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { captureRef } from 'react-native-view-shot';

const StudentIndividualStatistics = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { course, userId, studentName } = route.params;

  const [chartWidth, setChartWidth] = useState(Dimensions.get('window').width - 40);
  const [studentStats, setStudentStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Date filters
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  );
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const { token } = useAuth();
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const gradeChartRef = useRef(null);
  const submissionChartRef = useRef(null);
  const globalChartRef = useRef(null);

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
  }, []);

  const dynamicChartWidth = (labelsCount: number, minWidth: number) =>
    Math.max(minWidth, labelsCount * 60); // one bar + gap per label

  const fetchStatistics = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);

      const response = await fetch(
        `${API_URL}/api/courses/statistics/course/${course.id}/user/${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error('Failed to fetch student statistics');

      const data = await response.json();
      console.log('Response data:', data);
      console.log('Fetched student statistics:', data);

      const newStats = data.statistics;

      if (JSON.stringify(newStats) !== JSON.stringify(studentStats)) {
        setStudentStats(newStats);
      }
    } catch (error) {
      if (showLoading) {
        Alert.alert('Error', 'Failed to load student statistics');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const filterByDate = (dataArray) => {
    if (!dataArray || !Array.isArray(dataArray)) return [];
    return dataArray.filter((item) => {
      const date = new Date(item.date);
      return date >= startDate && date <= endDate;
    });
  };

  const getStudentStats = () => {
    if (!studentStats) return null;

    const filteredDates = filterByDate(studentStats.statistics_for_assignments || []);

    let avgGrade, avgSubmissionRate, totalActiveDays;

    if (filteredDates.length > 0) {
      const validGrades = filteredDates.filter((d) => d.average_grade > 0);
      avgGrade =
        validGrades.length > 0
          ? validGrades.reduce((sum, d) => sum + d.average_grade, 0) /
          validGrades.length
          : 0;
      avgSubmissionRate =
        filteredDates.reduce((sum, d) => sum + (d.submission_rate || 0), 0) /
        filteredDates.length;
      totalActiveDays = filteredDates.length;
    } else {
      avgGrade = studentStats.average_grade || 0;
      avgSubmissionRate = studentStats.submission_rate || 0;
      totalActiveDays = studentStats.statistics_for_assignments?.length || 0;
    }

    return {
      averageGrade: avgGrade.toFixed(1),
      submissionRate: (avgSubmissionRate * 100).toFixed(1),
      activeDays: totalActiveDays,
      totalDates: studentStats.statistics_for_assignments?.length || 0,
    };
  };

  const getGlobalChartData = (stats) => {
    if (!stats) return null;

    const avgGrade = parseFloat(stats.averageGrade);
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

  // ✅ Función getChartData actualizada con lógica del 0 invisible
  // ✅ Función getChartData mejorada para StudentIndividualStatistics
  const getChartData = () => {
    if (!studentStats?.statistics_for_assignments?.length) {
      return { gradeData: null, submissionData: null};
    }

    const filtered = filterByDate(studentStats.statistics_for_assignments);
    const uniq = Array.from(
      new Map(
        filtered
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .map(d => [d.date.split('T')[0], d]) // YYYY-MM-DD key
      ).values()
    );

    const active = uniq.filter(d => d.average_grade > 0 || d.submission_rate > 0);

    if (!active.length) {
      return {
        gradeData: null,
        submissionData: null,
      };
    }

    let lastGrade = studentStats.average_grade || 0;
    let lastRate  = studentStats.submission_rate || 0;

    const normalized = active.map(d => {
      if (d.average_grade > 0)   lastGrade = d.average_grade;
      if (d.submission_rate > 0) lastRate  = d.submission_rate;

      return { ...d, average_grade: lastGrade, submission_rate: lastRate };
    });

    /* 4️⃣  labels & datasets */
    const labels = normalized.map(d => {
      const dt = new Date(d.date);
      return `${dt.getDate()}/${dt.getMonth() + 1}`;
    });

    const gradeData = {
      labels,
      datasets: [{
        data: normalized.map(d => d.average_grade),
        color: (o = 1) => `rgba(59,130,246,${o})`,
      }],
    };

    const submissionData = {
      labels,
      datasets: [{
        data: normalized.map(d => d.submission_rate * 100),
        color: (o = 1) => `rgba(59,130,246,${o})`,
      }],
    };

    return { gradeData, submissionData };
  };

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
      const stats = getStudentStats();
      const globalChartData = getGlobalChartData(stats);
      const studentDisplayName = studentName || `Student ${userId}`;
      const { gradeData, submissionData } = getChartData();

      console.log('Waiting for charts to render...');
      await new Promise((resolve) => setTimeout(resolve, 2000));

      let gradeChartImage = '';
      let submissionChartImage = '';
      let trendChartImage = '';

      console.log('Starting chart capture...');

      try {
        if (trendChartRef.current && trendData) {
          console.log('Capturing trend chart...');
          trendChartImage = await captureRef(trendChartRef.current, {
            format: 'png',
            quality: 0.8,
            result: 'base64',
          });
          console.log(
            'Trend chart captured successfully, length:',
            trendChartImage.length,
          );
        }

        if (submissionChartRef.current && submissionData) {
          console.log('Capturing submission chart...');
          submissionChartImage = await captureRef(submissionChartRef.current, {
            format: 'png',
            quality: 0.8,
            result: 'base64',
          });
          console.log(
            'Submission chart captured successfully, length:',
            submissionChartImage.length,
          );
        }

        if (gradeChartRef.current && gradeData) {
          console.log('Capturing grade chart...');
          gradeChartImage = await captureRef(gradeChartRef.current, {
            format: 'png',
            quality: 0.8,
            result: 'base64',
          });
          console.log(
            'Grade chart captured successfully, length:',
            gradeChartImage.length,
          );
        }
      } catch (error) {
        console.log('Error capturing charts:', error);
      }

      const filteredDates = filterByDate(
        studentStats?.statistics_for_assignments || [],
      );
      const sortedDates = filteredDates.sort(
        (a, b) => new Date(a.date) - new Date(b.date),
      );

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
          .data-section { margin: 30px 0; page-break-inside: avoid; }
          .data-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #007AFF; }
          .data-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          .data-table th, .data-table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          .data-table th { background-color: #f8f9fa; font-weight: bold; }
          .data-table tr:nth-child(even) { background-color: #f9f9f9; }
          h1 { color: #007AFF; }
          h2 { color: #333; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Individual Student Report</h1>
          <h2>${studentDisplayName}</h2>
          <h3>Course: ${course.name}</h3>
          <p>Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
        
        <div class="stats">
          <h2>📈 Performance Summary</h2>
          <div class="metric"><span><strong>Average Grade:</strong></span><span>${stats?.averageGrade || 'N/A'}</span></div>
          <div class="metric"><span><strong>Submission Rate:</strong></span><span>${stats?.submissionRate || 'N/A'}%</span></div>
          <div class="metric"><span><strong>Active Days:</strong></span><span>${stats?.activeDays || 0} / ${stats?.totalDates || 0}</span></div>
          <div class="metric"><span><strong>Period:</strong></span><span>${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}</span></div>
        </div>

        ${trendChartImage
          ? `
          <div class="chart-section">
            <h2 class="chart-title">📈 Grade Evolution</h2>
            <img src="data:image/png;base64,${trendChartImage}" class="chart-image" alt="Trend Chart" />
          </div>
        `
          : ''
        }

        ${submissionChartImage
          ? `
          <div class="chart-section">
            <h2 class="chart-title">📊 Task Completion Rate</h2>
            <img src="data:image/png;base64,${submissionChartImage}" class="chart-image" alt="Submission Chart" />
          </div>
        `
          : ''
        }

        ${gradeChartImage
          ? `
          <div class="chart-section">
            <h2 class="chart-title">📊 Weekly Performance</h2>
            <img src="data:image/png;base64,${gradeChartImage}" class="chart-image" alt="Grade Chart" />
          </div>
        `
          : ''
        }

        ${sortedDates.length > 0
          ? `
          <div class="data-section">
            <h2 class="data-title">📅 Daily Performance Data</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Average Grade</th>
                  <th>Submission Rate (%)</th>
                </tr>
              </thead>
              <tbody>
                ${sortedDates
            .map(
              (item) => `
                  <tr>
                    <td>${new Date(item.date).toLocaleDateString()}</td>
                    <td>${(item.average_grade || 0).toFixed(1)}</td>
                    <td>${((item.submission_rate || 0) * 100).toFixed(1)}%</td>
                  </tr>
                `,
            )
            .join('')}
              </tbody>
            </table>
          </div>
        `
          : ''
        }

        ${sortedDates.length > 1
          ? `
          <div class="data-section">
            <h2 class="data-title">📈 Performance Analysis</h2>
            <div class="metric">
              <span><strong>Best Grade:</strong></span>
              <span>${Math.max(...sortedDates.map((d) => d.average_grade || 0)).toFixed(1)}</span>
            </div>
            <div class="metric">
              <span><strong>Lowest Grade:</strong></span>
              <span>${Math.min(...sortedDates.filter((d) => d.average_grade > 0).map((d) => d.average_grade || 0)).toFixed(1)}</span>
            </div>
            <div class="metric">
              <span><strong>Best Submission Rate:</strong></span>
              <span>${(Math.max(...sortedDates.map((d) => d.submission_rate || 0)) * 100).toFixed(1)}%</span>
            </div>
            <div class="metric">
              <span><strong>Grade Trend:</strong></span>
              <span>${sortedDates.length > 1 && sortedDates[sortedDates.length - 1].average_grade > sortedDates[0].average_grade ? '📈 Improving' : sortedDates.length > 1 && sortedDates[sortedDates.length - 1].average_grade < sortedDates[0].average_grade ? '📉 Declining' : '➡️ Stable'}</span>
            </div>
          </div>
        `
          : ''
        }

        <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
          <p>Generated by Student Statistics App</p>
        </div>
      </body>
    </html>`;

      const fileName = `student_${studentDisplayName.replace(/[^a-zA-Z0-9]/g, '_')}_${course.name.replace(/[^a-zA-Z0-9]/g, '_')}_${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')}.pdf`;

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

      console.log('Generating PDF...');
      const pdf = await RNHTMLtoPDF.convert(options);
      console.log('PDF generated successfully');

      await downloadAndShareFile({
        name: fileName,
        content: pdf.base64,
      });

      //Alert.alert('Success', 'PDF exported successfully!');
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
        <Text style={styles.loadingText}>Loading student statistics...</Text>
      </View>
    );
  }

  const stats = getStudentStats();
  const globalChartData = getGlobalChartData(stats);
  const { gradeData, submissionData, trendData } = getChartData();
  const screenWidth = Dimensions.get('window').width;
  const studentDisplayName = studentName || `Student ${userId}`;

  if (!stats) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noDataText}>
          No statistics available for this student
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>📊 Student Performance</Text>
          <Text style={styles.subtitle}>{studentDisplayName}</Text>
          <Text style={styles.courseText}>{course.name}</Text>
        </View>
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
            <Text style={styles.statValue}>{stats.averageGrade}</Text>
            <Text style={styles.statLabel}>Avg Grade</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.submissionRate}%</Text>
            <Text style={styles.statLabel}>Completion Rate</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.activeDays}</Text>
            <Text style={styles.statLabel}>Active Days</Text>
          </View>
        </View>

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

      </View>

      <View style={styles.filtersContainer}>
        <Text style={styles.sectionTitle}>🔍 Date Range</Text>
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
      </View>

      {/* ✅ Charts actualizados - Todo BarChart */}
      {(submissionData || gradeData) && (
        <View style={styles.chartsContainer}>
          {gradeData && (
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>📈 Grade Evolution</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View ref={gradeChartRef} collapsable={false} style={{backgroundColor:'white'}}>
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
              </ScrollView>
            </View>
          )}

          {submissionData && (
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>📊 Task Completion Rate (%)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View ref={submissionChartRef} collapsable={false} style={{backgroundColor:'white'}}>
                  <BarChart
                    data={submissionData}
                    width={dynamicChartWidth(submissionData.labels.length, screenWidth - 40)}
                    height={200}
                    fromZero
                    yAxisMin={0}
                    yAxisMax={100}
                    chartConfig={chartConfig}
                    style={styles.chart}
                  />
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      )}

      <View style={styles.buttonContainer}>
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
            <Text style={styles.buttonText}>📄 Export PDF</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>

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

// ✅ chartConfig actualizado para mejor soporte de BarChart
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
  propsForBackgroundLines: {
    strokeDasharray: '',
    stroke: '#e3e3e3',
    strokeWidth: 1,
  },
  yAxisMinimum: 0,
  paddingTop: 20,
  count: 5,
  fillShadowGradient: 'transparent',
  fillShadowGradientOpacity: 0,
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
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#007AFF',
    marginTop: 2,
    fontWeight: '600',
  },
  courseText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
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
  chartComponent: {
    backgroundColor: '#fff',
    paddingTop: 10,
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
    backgroundColor: '#3A59D1',
    padding: 15,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#7AC6D2',
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
    marginBottom: 20,
  },
});

export default StudentIndividualStatistics;
