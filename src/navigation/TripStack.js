import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function TripStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: false, animation: 'fade' }}>
      <Stack.Screen name="Home" component={HomeScreen} />      
    </Stack.Navigator>
  );
}
