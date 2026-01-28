import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import StudentDashboardScreen from './screens/StudentDashboardScreen';
import TutorDashboardScreen from './screens/TutorDashboardScreen';
import ProfileScreen from './screens/ProfileScreen';
import ScheduleScreen from './screens/ScheduleScreen';

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

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen
          name="MainTabs"
          component={MyTabs}
          options={{ title: 'Find a Session', headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}