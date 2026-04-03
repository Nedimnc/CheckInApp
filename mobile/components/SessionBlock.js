import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../styles/theme';

// Reusable session block used by TutorDashboard and Schedule screens.
// Props:
// - session: session object
// - currentUser: { user_id, role }
// - users: array of users (optional)
// - student: pre-resolved student object (optional)
// - onPressQR, onPressCopy, onPressEdit, onPressCancel, onPressScan, onUnbook: callbacks

export default function SessionBlock({ session, currentUser, users = [], student, onPressQR, onPressCopy, onPressEdit, onPressCancel, onPressScan, onUnbook, onPressBook }) {
  const userId = currentUser?.user_id;
  const userRole = currentUser?.role;
  const isImTheTutor = (session.tutor_id && userId) ? session.tutor_id === userId : false;
  const isBookedByMe = (session.student_id && userId) ? session.student_id === userId : false;
  const counterpartId = isImTheTutor ? session.student_id : session.tutor_id;
  const counterpartLabel = isImTheTutor ? 'Student' : 'Tutor';
  const counterpartName = student?.name || users.find(u => u.user_id === counterpartId)?.name || 'Unknown';
  const isPast = new Date(session.end_time) < new Date();
  const isCheckedIn = session.status === 'checked_in';
  const isBooked = session.status === 'booked';
  const slideAnim = useRef(new Animated.Value(isBookedByMe ? 1 : 0)).current;

  let accentColor = '#2D52A2';
  if (isPast) accentColor = '#CCC';
  else if (isCheckedIn) accentColor = '#5B21B6';
  else if (isBooked) accentColor = '#2E7D32';

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isBookedByMe ? 1 : 0,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isBookedByMe]);

  const bookTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -500],
  });

  const actionTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [500, 0],
  });

  return (
    <View style={[styles.sessionCard, isCheckedIn && styles.checkedInSessionCard, isBooked && styles.bookedSessionCard, !isBooked && !isCheckedIn && styles.openSessionCard, { borderLeftColor: accentColor }]}>

      <View style={styles.cardHeader}>
        <Text style={styles.subjectText}>{session.subject}: {session.title}</Text>
        <View style={[styles.statusBadge, isPast ? styles.pastBadge : (isCheckedIn ? styles.checkedInBadge : (isBooked ? styles.bookedBadge : styles.openBadge))]}>
          <Text style={[styles.statusText, isPast ? styles.pastText : (isCheckedIn ? styles.checkedInText : (isBooked ? styles.bookedText : styles.openText))]}>
            {isPast ? 'PAST' : (isCheckedIn ? 'CHECKED IN ✓' : (isBooked ? 'BOOKED' : 'OPEN'))}
          </Text>
        </View>
      </View>

      <View style={[styles.infoRow, { marginTop: 10 }]}>
        <Ionicons name="calendar-outline" size={16} color="#666" />
        <Text style={styles.infoText}>
          {new Date(session.start_time).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="time-outline" size={16} color="#666" />
        <Text style={styles.infoText}>
          {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={16} color="#666" />
        <Text style={styles.infoText}>{session.location}</Text>
      </View>

      {!isImTheTutor && (
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{counterpartLabel}: {counterpartName}</Text>
        </View>
      )}

      {isImTheTutor && (isBooked || isCheckedIn) && counterpartName && (
        <View style={styles.studentInfoBox}>
          <Text style={styles.studentLabel}>Booked Student</Text>
          <View style={styles.studentRow}>
            <Ionicons name="person" size={16} color={isPast ? '#CCC' : (isCheckedIn ? '#5B21B6' : '#2E7D32')} />
            <Text style={styles.studentInfo}>{counterpartName}</Text>
          </View>
          <View style={styles.studentRow}>
            <Ionicons name="card-outline" size={16} color="#555" />
            <Text style={styles.studentInfo}>{student.panther_id || 'N/A'}</Text>
          </View>
        </View>
      )}

      {/* ACTIONS: horizontal scroll so buttons don't overflow */}
      {!isPast && (
        <View style={styles.actionRowContainer}>
          {isImTheTutor ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tutorActionRowScroll}
            >
              <TouchableOpacity style={[styles.actionButton, styles.qrButton]} onPress={onPressQR}>
                <Ionicons name="qr-code-outline" size={18} color="#2D52A2" />
                <Text style={[styles.actionText, { color: '#2D52A2' }]}>QR</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, styles.copyButton]} onPress={onPressCopy}>
                <Ionicons name="copy-outline" size={18} color='#679968' />
                <Text style={[styles.actionText, { color: '#679968' }]}>Copy</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={onPressEdit}>
                <Ionicons name="create-outline" size={18} color="#F57C00" />
                <Text style={[styles.actionText, { color: '#F57C00' }]}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onPressCancel}>
                <Ionicons name="trash-outline" size={18} color="#D32F2F" />
                <Text style={[styles.actionText, { color: '#D32F2F' }]}>Delete</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            /* If a student and a book action is provided, show Book button for open sessions */
            <View style={styles.studentActionRow}>
              <Animated.View style={[styles.animatedContainer, { transform: [{ translateX: bookTranslate }] }]}>
                {onPressBook && userRole === 'student' && session.status === 'open' && (
                  <TouchableOpacity style={[styles.bookActionButton]} onPress={onPressBook}>
                    <Text style={[styles.bookActionText]}>Book Session</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>

              <Animated.View style={[styles.animatedContainer, { transform: [{ translateX: actionTranslate }], alignItems: 'flex-end' }]}>
                {isBookedByMe && (
                  /* Show Scan/Unbook only if the current student has booked this session */
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <TouchableOpacity style={[styles.actionButton, styles.qrButton]} onPress={onPressScan}>
                      <Ionicons name="qr-code-outline" size={18} color="#2D52A2" />
                      <Text style={[styles.actionText, { color: '#2D52A2' }]}>Scan QR</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onUnbook}>
                      <Ionicons name="close-circle-outline" size={18} color="#D32F2F" />
                      <Text style={[styles.actionText, { color: '#D32F2F' }]}>Unbook</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Animated.View>
            </View>
          )}
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  sessionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.lg,
    padding: theme.sizes.cardPadding,
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
    borderLeftWidth: 5,
    borderLeftColor: theme.colors.primary,
  },
  openSessionCard: { borderLeftColor: theme.colors.primary, backgroundColor: theme.colors.card },
  bookedSessionCard: { borderLeftColor: theme.colors.success, backgroundColor: theme.colors.card },
  checkedInSessionCard: { borderLeftColor: '#5B21B6', backgroundColor: theme.colors.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.xs },
  subjectText: { fontSize: theme.typography.h3, fontWeight: 'bold', color: theme.colors.text, flex: 1, paddingRight: theme.spacing.xs },

  statusBadge: { paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xxs, borderRadius: theme.radii.sm },
  openBadge: { backgroundColor: '#E3F2FD' },
  bookedBadge: { backgroundColor: '#E8F5E9' },
  checkedInBadge: { backgroundColor: '#EDE9FE' },
  pastBadge: { backgroundColor: '#F5F5F5' },

  statusText: { fontSize: theme.typography.caption, fontWeight: 'bold' },
  openText: { color: theme.colors.primary },
  bookedText: { color: theme.colors.success },
  checkedInText: { color: '#5B21B6' },
  pastText: { color: '#999' },

  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs },
  infoText: { marginLeft: theme.spacing.xs, color: theme.colors.textSecondary, fontSize: theme.typography.body },

  studentInfoBox: {
    marginTop: theme.spacing.md, padding: theme.spacing.sm, backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.sm, borderWidth: 1, borderColor: theme.colors.border,
  },
  studentLabel: { fontSize: theme.typography.caption, color: theme.colors.muted, marginBottom: theme.spacing.xxs, fontWeight: '600' },
  studentRow: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.xxs },
  studentInfo: { marginLeft: theme.spacing.xs, fontWeight: 'bold', color: theme.colors.text },

  actionRowContainer: {
    marginTop: theme.spacing.md, paddingTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: '#EEE', width: '100%',
  },
  tutorActionRowScroll: {
    minWidth: '100%', justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  studentActionRow: {
    position: 'relative',
    flexDirection: 'row',
    width: '100%',
    height: 40,
    overflow: 'hidden',
  },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm, borderRadius: 30, borderWidth: 1
  },
  qrButton: { borderColor: theme.colors.primaryLight, backgroundColor: '#F5F7FA' },
  copyButton: { borderColor: '#b6e0b5', backgroundColor: '#f5fff5' },
  editButton: { borderColor: '#FFE0B2', backgroundColor: '#FFF3E0' },
  cancelButton: { borderColor: '#FFCDD2', backgroundColor: '#FFEBEE' },
  actionText: { fontWeight: '600', fontSize: theme.typography.button, marginLeft: theme.spacing.xs },
  bookActionButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    width: '100%', // Take full width of the container
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookActionText: { color: '#FFF', fontWeight: '700', fontSize: theme.typography.button },
  animatedContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});
