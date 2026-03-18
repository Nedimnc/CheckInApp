import React, { useContext, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { requestNotificationPermissions } from './services/notifications';

// Import Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import StudentDashboardScreen from './screens/StudentDashboardScreen';
import TutorDashboardScreen from './screens/TutorDashboardScreen';
import ProfileScreen from './screens/ProfileScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import SessionCreateScreen from './screens/SessionCreateScreen';
import SessionQRScreen from './screens/SessionQRScreen';
import ScannerScreen from './screens/ScannerScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MyTabs({ route }) {
  const { role } = route.params || { role: 'student' }; // Default to student if not provided
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Schedule') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2D52A2',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={role === 'student' ? StudentDashboardScreen : TutorDashboardScreen}
        options={{
          headerTitle: role === 'student' ? 'Student Dashboard' : 'Tutor Dashboard',
          headerTitleStyle: { fontSize: 20 }
        }} />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          headerTitle: 'Schedule',
          headerTitleStyle: { fontSize: 20 }
        }} />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerTitle: 'Profile',
          headerTitleStyle: { fontSize: 20 }
        }} />
    </Tab.Navigator>
  );
};

function RootNavigation() {
  const { user, isLoading } = useContext(AuthContext);

  useEffect(() => {
    console.log('RootNavigation mounted. Requesting notification permissions...');
    const getPermissions = async () => {
      try {
        const { status } = await requestNotificationPermissions();
        console.log('Notification permissions granted:', status);
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'You will not receive notifications about new bookings.');
        }
      } catch (error) {
        console.error('Error requesting notification permissions:', error);
      }
    };
    getPermissions();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2D52A2" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user == null ? (
          <Stack.Group>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: true }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: true }} />
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="MainTabs" component={MyTabs} initialParams={{ role: user.role }} options={{ headerShown: false }} />
            <Stack.Screen name="SessionCreate" component={SessionCreateScreen} options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="SessionQR" component={SessionQRScreen} options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="Scanner" component={ScannerScreen} options={{ headerShown: false, presentation: 'modal' }} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer >
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}