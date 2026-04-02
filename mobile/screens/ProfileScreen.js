import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStudentStats, getTutorStats } from '../api';
import { BarChart } from "react-native-gifted-charts";
import { useIsFocused } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import theme from '../styles/theme';

export default function Profile({ navigation }) {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();
  const { logout } = useContext(AuthContext);

  const processStats = (data) => {
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
  };

  const loadStats = async () => {
    if (!user.user_id) return;
    try {
      const fetchApi = user.role === 'student' ? getStudentStats : getTutorStats;
      const data = await fetchApi(user.user_id);
      processStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    loadStats();
    setRefreshing(false);
  };

  useEffect(() => {
    if (isFocused) {
      loadStats();
    }
  }, [isFocused]);

  return (
    <ScrollView style={styles.content} contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
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
              <Text style={styles.cardHeader}>Time Spent</Text>
              <Text style={styles.cardInfo}>{Number(stats?.total_hours || 0).toFixed(1)} hours</Text>
              <Text style={styles.cardSubtext}>Total Sessions: {stats?.total_sessions || 0}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.cardHeader}>Session Hours per Month</Text>
              <View style={{ marginLeft: -10, marginTop: 20 }}>
                <BarChart
                  data={stats?.chartData || []}
                  height={80}
                  width={100}
                  barWidth={10}
                  initialSpacing={10}
                  spacing={15}
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
              <Text style={styles.cardHeader}>Impact</Text>
              <Text style={styles.cardInfo}>{stats?.total_unique_students || 0} {Number(stats?.total_unique_students) === 1 ? 'student' : 'students'}</Text>
              <Text style={styles.cardSubtext}>Unique Students</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.cardHeader}>Recent</Text>
              <Text style={styles.cardInfo}>{Number(stats?.hours_taught_last_month || 0).toFixed(1)} hours</Text>
              <Text style={styles.cardSubtext}>Hours (Last month)</Text>
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
  content: { flex: 1, padding: theme.spacing.md },
  headerText: { fontSize: theme.typography.h1, fontWeight: 'bold' },
  subsectionText: { fontSize: theme.typography.h2, fontWeight: 'bold', marginBottom: theme.spacing.lg },
  profileSection: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.sm, marginBottom: theme.spacing.lg },
  bottomContent: { marginTop: 'auto' },
  logoutButton: { paddingVertical: theme.spacing.md, borderRadius: theme.radii.lg, alignItems: 'center', backgroundColor: theme.colors.danger, marginBottom: 'auto' },
  logoutText: { color: '#FFF', fontSize: theme.typography.h3, fontWeight: 'bold' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#bbbec2', justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing.lg },
  avatarText: { fontSize: 50 },
  nameText: { fontSize: theme.typography.h2, fontWeight: '500' },
  learningStats: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    width: '48%', height: 200, ...theme.common.card,
    padding: theme.spacing.lg, marginBottom: theme.spacing.lg, flexDirection: 'column',
    borderLeftWidth: 4, borderLeftColor: theme.colors.primary,
  },
  cardHeader: { marginBottom: 'auto', fontSize: theme.typography.h3, fontWeight: '600' },
  cardInfo: { fontSize: theme.typography.h1, fontWeight: 'bold' },
  cardSubtext: { marginTop: 'auto', fontSize: theme.typography.body, color: theme.colors.muted },
  accInfoContainer: {
    height: 100, ...theme.common.card, padding: theme.spacing.md,
    marginBottom: theme.spacing.lg, borderLeftWidth: 5, borderLeftColor: theme.colors.primary,
  },
  accountInfo: { flex: 1, flexDirection: 'column', justifyContent: 'space-between' },
  infoField: { flexDirection: 'row', justifyContent: 'space-between' },
  accountInfoText: { fontSize: theme.typography.body, fontWeight: '600', color: theme.colors.textSecondary },
  accountInfoField: { fontSize: theme.typography.body, fontWeight: '500' },
  separator: { height: 1, backgroundColor: theme.colors.border },
});