import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStudentStats, getTutorStats } from '../api';
import { BarChart } from "react-native-gifted-charts";
import { useIsFocused } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';

export default function Profile({ navigation }) {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    if (isFocused) {
      loadStats();
    }
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    const fetchStats = user.role === 'student' ? getStudentStats : getTutorStats;
    fetchStats(user.user_id).then((data) => {
      if (user.role === 'student') {
        const chartData = data.monthlyBreakdown?.map(item => ({
          value: parseFloat(item.hours_count) || 0,
          label: item.month_label,
          frontColor: '#177AD5',
        }));
        setStats({ ...data.summary, chartData });
      } else {
        setStats(data);
      }
      setRefreshing(false);
    });
  };

  const loadStats = () => {
    if (!user.user_id) return;
    getStudentStats(user.user_id).then((data) => {
      const chartData = data.monthlyBreakdown?.map(item => ({
        value: parseFloat(item.hours_count) || 0,
        label: item.month_label,
        frontColor: '#177AD5',
      }));
      setStats({ ...data.summary, chartData });
    });
  };

  return (
    <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Ionicons name='person' size={52} color='white' />
        </View>
        <Text style={styles.nameText}>{user.name}</Text>
      </View>
      {/* conditional logic for tutor and student stats */}
      {user.role === 'student' ? (
        <>
          <Text style={styles.subsectionText}>My Learning Stats</Text>
          <View style={styles.learningStats}>
            <View style={styles.statCard}>
              <Text style={styles.cardHeader}>Time Spent in Sessions</Text>
              <Text style={styles.cardInfo}>{Number(stats?.total_hours || 0).toFixed(1)} hours</Text>
              <Text style={styles.cardSubtext}>Total Sessions: {stats?.total_sessions || 0}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.cardHeader}>Time Previously Spent Learning</Text>
              <View style={{ marginLeft: -10, marginTop: 20 }}>
                <BarChart
                  data={stats?.chartData || []}
                  height={80}
                  width={100}
                  barWidth={10}
                  initialSpacing={10}
                  spacing={18}
                  noOfSections={3}
                  barBorderRadius={4}
                  yAxisThickness={0}
                  xAxisThickness={0}
                  disablePress
                  disableScroll
                />
              </View>
            </View>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.subsectionText}>My Teaching Stats</Text>
          <View style={styles.learningStats}>
            <View style={styles.statCard}>
              <Text style={styles.cardHeader}>Total Students Impacted</Text>
              <Text style={styles.cardInfo}>{stats?.total_unique_students || "null"} {Number(stats?.total_unique_students) === 1 ? 'student' : 'students'}</Text>
              <Text style={styles.cardSubtext}>Total Sessions: {stats?.total_sessions}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.cardHeader}>Hours Taught Last Month</Text>
              <Text style={styles.cardInfo}>{Number(stats?.hours_taught_last_month).toFixed(1)} hours</Text>
            </View>
          </View>
        </>
      )}
      <Text style={styles.subsectionText}>Account Information</Text>
      <View style={styles.accInfoContainer}>
        <View style={styles.accountInfo}>
          <View style={styles.infoField}>
            <Text style={styles.accountInfoText}>Email: </Text>
            <Text style={styles.accountInfoField}>{user.email}</Text>
          </View>
          <View style={styles.separator}></View>
          <View style={styles.infoField}>
            <Text style={styles.accountInfoText}>PantherID: </Text>
            <Text style={styles.accountInfoField}>{user.panther_id}</Text>
          </View>
        </View>
      </View>
      <View style={styles.bottomContent}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 20, backgroundColor: '#F5F7FA' },
  headerText: { fontSize: 35, fontWeight: 'bold' },
  subsectionText: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  profileSection: { flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 30 },
  bottomContent: { marginBottom: 20 },
  logoutButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#D9534F', marginTop: 70 },
  logoutText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#bbbec2', justifyContent: 'center', alignItems: 'center', marginRight: 30 },
  avatarText: { fontSize: 50 },
  nameText: { fontSize: 26, fontWeight: '500' },
  learningStats: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    width: '48%',
    height: 200,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'column',
  },
  cardHeader: { marginBottom: 'auto', fontSize: 20, fontWeight: '600' },
  cardInfo: { fontSize: 28, fontWeight: 'bold' },
  cardSubtext: { marginTop: 'auto', fontSize: 15, color: '#7d7d7d' },
  accInfoContainer: {
    height: 100,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  accountInfo: { flex: 1, flexDirection: 'column', justifyContent: 'space-between' },
  infoField: { flexDirection: 'row', justifyContent: 'space-between' },
  accountInfoText: { fontSize: 16, fontWeight: '600', color: '#8e8e8e' },
  accountInfoField: { fontSize: 16, fontWeight: '500' },
  separator: { height: 1, backgroundColor: '#E0E0E0' },
});