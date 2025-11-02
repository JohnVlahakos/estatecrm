import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (Platform.OS === 'web') {
    console.log('Push notifications are not available on web');
    return undefined;
  }

  let token: string | undefined;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return undefined;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export async function schedulePropertyAvailabilityNotification(
  propertyTitle: string,
  availabilityDate: Date
): Promise<string | undefined> {
  if (Platform.OS === 'web') {
    console.log('Push notifications are not available on web');
    return undefined;
  }

  const notificationDate = new Date(availabilityDate);
  notificationDate.setDate(notificationDate.getDate() - 7);

  if (notificationDate.getTime() < Date.now()) {
    console.log('Notification date is in the past');
    return undefined;
  }

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Property Available Soon! 🏠',
        body: `"${propertyTitle}" will be available in 7 days. Time to find new tenants!`,
        data: { propertyTitle, availabilityDate: availabilityDate.toISOString() },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notificationDate,
      },
    });

    console.log('Notification scheduled:', identifier);
    return identifier;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return undefined;
  }
}

export async function cancelScheduledNotification(identifier: string): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    console.log('Notification cancelled:', identifier);
  } catch (error) {
    console.error('Error cancelling notification:', error);
  }
}

export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  if (Platform.OS === 'web') {
    return [];
  }

  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}

export async function sendNewMatchNotification(
  clientName: string,
  propertyTitle: string,
  matchScore: number
): Promise<void> {
  if (Platform.OS === 'web') {
    console.log('Push notifications are not available on web');
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎯 New Match Found!',
        body: `${clientName} matches "${propertyTitle}" with ${matchScore}% compatibility!`,
        data: { type: 'new_match', clientName, propertyTitle, matchScore },
        sound: true,
      },
      trigger: null,
    });
    console.log('Match notification sent');
  } catch (error) {
    console.error('Error sending match notification:', error);
  }
}

export async function scheduleAppointmentNotification(
  appointmentTitle: string,
  appointmentDate: Date,
  notifyBefore: number = 60
): Promise<string | undefined> {
  if (Platform.OS === 'web') {
    console.log('Push notifications are not available on web');
    return undefined;
  }

  const notificationDate = new Date(appointmentDate);
  notificationDate.setMinutes(notificationDate.getMinutes() - notifyBefore);

  if (notificationDate.getTime() <= Date.now()) {
    console.log('Notification date is in the past, sending immediately');
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📅 Appointment Reminder',
          body: `"${appointmentTitle}" is starting soon!`,
          data: { type: 'appointment', title: appointmentTitle, date: appointmentDate.toISOString() },
          sound: true,
        },
        trigger: null,
      });
      return 'immediate';
    } catch (error) {
      console.error('Error sending immediate notification:', error);
      return undefined;
    }
  }

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📅 Appointment Reminder',
        body: `"${appointmentTitle}" is in ${notifyBefore} minutes!`,
        data: { type: 'appointment', title: appointmentTitle, date: appointmentDate.toISOString() },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notificationDate,
      },
    });

    console.log('Appointment notification scheduled:', identifier);
    return identifier;
  } catch (error) {
    console.error('Error scheduling appointment notification:', error);
    return undefined;
  }
}
