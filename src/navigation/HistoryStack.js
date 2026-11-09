import React from 'react';
import { Pressable } from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useLenguage } from '../context/LenguageContext';
import HistoryScreen from '../screens/HistoryScreen';
import TripDetailScreen from '../screens/TripDetailScreen';

const Stack = createNativeStackNavigator();

export default function HistoryStack() {
    const { t } = useLenguage();
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="HistoryList"
                options={{
                    headerShown: false
                }}                
                component={HistoryScreen}            
            />
            <Stack.Screen name="TripDetail" component={TripDetailScreen} options={{ title: t('history.detail') }} />
        </Stack.Navigator>
    );
}