import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import MainDrawer from './MainDrawer';
import RegistrationTabs from './RegistrationTabs';
import LoginScreen from '../screens/LoginScreen';

export default function RootNavigator() {
    const { user, driver, loading } = useAuth();
    if (loading) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" /></View>;
    return (
        <NavigationContainer>
            {!user ? <LoginScreen /> : !driver ? <RegistrationTabs /> : <MainDrawer />}
        </NavigationContainer>
    );
}
