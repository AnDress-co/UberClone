import React from 'react';
import { Pressable, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { useLenguage } from '../context/LenguageContext';
import { RegistrationProvider, useRegistration } from '../context/RegistrationContext';
import DocumentsTab from '../screens/DocumentsTab';
import DataPersonalTab from '../screens/DataPersonalTab';
import VehicleTab from '../screens/VehicleTab';

const Tab = createBottomTabNavigator();

function Tabs() {
  const { t } = useLenguage();
  const { signOut } = useAuth();
  const { sections } = useRegistration();
  const badge = (key) => (Object.keys(sections[key]).length ? '!' : undefined);

  return (
    <Tab.Navigator
      screenOptions={{
        headerTitle: t('register.title'),
        headerRight: () => (
          <Pressable onPress={signOut} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
            <Text style={{ color:colors.danger }}>{t('profile.logout')}{' '}</Text>            
            <Ionicons name="log-out-outline" color={colors.danger} size={20} />
          </Pressable>
        ),
        tabBarActiveTintColor: colors.primary,
      }}
    >
      <Tab.Screen name="Personal" component={DataPersonalTab}
        options={{ title: t('tab.personal'), tabBarBadge: badge('personal'), tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} /> }} />
      <Tab.Screen name="Vehicle" component={VehicleTab}
        options={{ title: t('tab.vehicle'), tabBarBadge: badge('vehicle'), tabBarIcon: ({ color, size }) => <Ionicons name="car" color={color} size={size} /> }} />
      <Tab.Screen name="Documents" component={DocumentsTab}
        options={{ title: t('tab.documents'), tabBarBadge: badge('documents'), tabBarIcon: ({ color, size }) => <Ionicons name="document-text" color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}

export default function RegistrationTabs() {
  return (
    <RegistrationProvider>
      <Tabs />
    </RegistrationProvider>
  );
}