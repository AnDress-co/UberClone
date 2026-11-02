import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications = null;
if (!isExpoGo) {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    });
}

export async function registerForPushToken() {
    if (!Notifications) return null; // Expo Go: no hay push remotas

    try {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('trip-requests', {
                name: 'Solicitudes de viaje',
                importance: Notifications.AndroidImportance.MAX,
            });
        }
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') return null;
        const token = await Notifications.getDevicePushTokenAsync();
        return typeof token.data === 'string' ? token.data : null;
    } catch {
        return null;
    }
}