import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import IncomingRequestScreen from '../screens/IncomingRequestScreen';
import TripInProgressScreen from '../screens/TripInProgressScreen';
import PaymentSummaryScreen from '../screens/PaymentSummaryScreen';

const Stack = createNativeStackNavigator();

export default function TripStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: false, animation: 'fade' }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="IncomingRequest" component={IncomingRequestScreen} />
            <Stack.Screen name="TripInProgress" component={TripInProgressScreen} />
            <Stack.Screen name="PaymentSummary" component={PaymentSummaryScreen} />
        </Stack.Navigator>
    );
}
