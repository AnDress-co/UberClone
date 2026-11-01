import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { LenguageProvider } from './src/context/LenguageContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LenguageProvider>
          <AuthProvider>            
            <RootNavigator />
            <StatusBar style="auto" />
          </AuthProvider>
        </LenguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
