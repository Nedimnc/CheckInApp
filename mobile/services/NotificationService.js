import * as Notifications from 'expo-notifications';

// 1. Configure the "In-App" behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export const requestNotificationPermissions = async () => {
    try {
        const { status } = await Notifications.requestPermissionsAsync();
        return { status }; 
    } catch (error) {
        console.error('Error in service:', error);
        return { status: 'failed' };
    }
};

// 3. The Notification Trigger
export const triggerLocalNotification = async (studentName) => {
    console.log('Triggering local notification for student:', studentName);
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "New Booking! 📅",
            body: `${studentName} just booked a session with you.`,
            sound: true
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 5, // Trigger after 5 seconds for testing
        },
    });
};