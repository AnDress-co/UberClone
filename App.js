import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { LenguageProvider } from './src/context/LenguageContext';
import RootNavigator from './src/navigation/RootNavigator';
import { TripProvider } from './src/context/TripContext';

export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <LenguageProvider>
                    <AuthProvider>
                        <TripProvider>
                            <RootNavigator />
                            <StatusBar style="auto" />
                        </TripProvider>
                    </AuthProvider>
                </LenguageProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
