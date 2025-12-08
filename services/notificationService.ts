import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export const requestNotificationPermissions = async (): Promise<boolean> => {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('Notification permission not granted');
            return false;
        }

        // For Android, create a notification channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#5B88F5',
            });

            await Notifications.setNotificationChannelAsync('tasks', {
                name: 'Tasks',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#5B88F5',
            });
        }

        return true;
    } catch (error) {
        console.error('Error requesting notification permissions:', error);
        return false;
    }
};

export const scheduleTaskAssignedNotification = async (
    taskTitle: string,
    assignedBy: string
): Promise<void> => {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🎯 Yeni Görev Atandı',
                body: `"${taskTitle}" görevi ${assignedBy} tarafından size atandı`,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                categoryIdentifier: 'tasks',
            },
            trigger: null, // Show immediately
        });
    } catch (error) {
        console.error('Error scheduling task assigned notification:', error);
    }
};

export const scheduleTaskDeadlineNotification = async (
    taskTitle: string,
    dueDate: Date,
    taskId: string
): Promise<string | null> => {
    try {
        // Schedule notification 1 day before deadline
        const oneDayBefore = new Date(dueDate);
        oneDayBefore.setDate(oneDayBefore.getDate() - 1);

        // Only schedule if deadline is in the future
        if (oneDayBefore.getTime() <= Date.now()) {
            return null;
        }

        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: '⏰ Görev Deadline Yaklaşıyor',
                body: `"${taskTitle}" görevinin bitiş tarihi yaklaşıyor`,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                data: { taskId },
                categoryIdentifier: 'tasks',
            },
            trigger: {
                date: oneDayBefore,
            },
        });

        return notificationId;
    } catch (error) {
        console.error('Error scheduling deadline notification:', error);
        return null;
    }
};

export const cancelTaskNotifications = async (notificationId: string): Promise<void> => {
    try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
        console.error('Error canceling notification:', error);
    }
};

export const sendLocalNotification = async (
    title: string,
    body: string
): Promise<void> => {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.DEFAULT,
            },
            trigger: null,
        });
    } catch (error) {
        console.error('Error sending local notification:', error);
    }
};
