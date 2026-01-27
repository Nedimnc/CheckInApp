import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
// Future Screens
// import DashboardScreen from './screens/DashboardScreen';
// import ProfileScreen from './screens/ProfileScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen}/>
        <Stack.Screen name="Register" component={RegisterScreen}/>
        {/* Future Screens */}
        {/* <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Find a Session' }}/> */}
        {/* <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Your Profile' }}/> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}