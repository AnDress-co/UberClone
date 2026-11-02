import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useLenguage } from '../context/LenguageContext';
import TripStack from './TripStack';
import ProfileScreen from '../screens/ProfileSreen';

const Drawer = createDrawerNavigator();
const icon = (name) => ({ color, size }) => <Ionicons name={name} color={color} size={size} />;

export default function MainDrawer() {
  const { t } = useLenguage();
  return (
    <Drawer.Navigator screenOptions={{ drawerActiveTintColor: '#111827' }}>
      <Drawer.Screen name="Trips" component={TripStack} options={{ title: t('nav.home'), drawerIcon: icon('home') }} />
      <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: t('nav.profile'), drawerIcon: icon('person') }} />
    </Drawer.Navigator>
  );
}
