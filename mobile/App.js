import 'react-native-get-random-values';
import React, { useContext } from 'react';
import { useAutoSync } from './services/useAutoSync';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import Toast, { BaseToast } from 'react-native-toast-message';

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

const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{ width: '92.7%', borderRadius: 20, borderLeftWidth: 0, borderLeftColor: 'white', justifyContent: 'center', alignItems: 'center' }}
      contentContainerStyle={{ paddingHorizontal: 0 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600'
      }}
      text2Style={{
        fontSize: 14,
        fontWeight: '400'
      }}
      renderLeadingIcon={() => 
      <View style={{ 
        justifyContent: 'center', marginLeft: 7, marginRight: 10, paddingHorizontal: 10, 
        alignContent: 'center', backgroundColor: '#e8f5ec', borderRadius: 15, height: '78%' }}>
        <Ionicons name="checkmark-circle" size={30} color='green' />
      </View>
      }
    />
  ),
  greeting: (props) => (
    <BaseToast
      {...props}
      style={{ width: '92.7%', borderRadius: 20, borderLeftWidth: 0, borderLeftColor: 'white', justifyContent: 'center', alignItems: 'center' }}
      contentContainerStyle={{ paddingHorizontal: 0 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600'
      }}
      text2Style={{
        fontSize: 14,
        fontWeight: '400'
      }}
      renderLeadingIcon={() => 
      <View style={{ 
        justifyContent: 'center', marginLeft: 7, marginRight: 10, paddingHorizontal: 10, 
        alignContent: 'center', backgroundColor: '#F5F7FA', borderRadius: 15, height: '78%' }}>
        <Ionicons name="hand-left-outline" size={30} color='#2D52A2' />
      </View>
      }
    />
  ),
  error: (props) => (
    <BaseToast
      {...props}
      style={{ width: '92.7%', borderRadius: 20, borderLeftWidth: 0, borderLeftColor: 'white', justifyContent: 'center', alignItems: 'center' }}
      contentContainerStyle={{ paddingHorizontal: 0 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600'
      }}
      text2Style={{
        fontSize: 14,
        fontWeight: '400'
      }}
      renderLeadingIcon={() => 
      <View style={{ 
        justifyContent: 'center', marginLeft: 7, marginRight: 10, paddingHorizontal: 10, 
        alignContent: 'center', backgroundColor: '#fcefef', borderRadius: 15, height: '78%' }}>
        <Ionicons name="close-circle" size={30} color='red' />
      </View>
      }
    />
  )
};

export default function App() {
  useAutoSync();
  return (
    <AuthProvider>
      <RootNavigation />
      <Toast
        position='top'
        topOffset={65}
        config={toastConfig}
        />
    </AuthProvider>
    
  );
}

