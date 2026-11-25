import * as n from 'expo-notifications';
import { Platform } from 'react-native';
import type { Item } from '@/types/item';

export async function reminderPermission(request = false) {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android' && request) {
    await n.setNotificationChannelAsync('reminders', { name: 'Task reminders', importance: n.AndroidImportance.HIGH });
  }
  const permission = request ? await n.requestPermissionsAsync() : await n.getPermissionsAsync();
  return permission.granted;
}

let pending = Promise.resolve();
export function syncReminders(user: string | undefined, items: Item[]) {
  if (Platform.OS === 'web') return Promise.resolve();
  const update = async () => {
    n.setNotificationHandler({ handleNotification: async () => ({
      shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
    }) });
    const enabled = user && await reminderPermission();
    const upcoming = enabled ? items.filter(i => i.user_id === user && i.type === 'task' && !i.done && i.due_at && Date.parse(i.due_at) > Date.now())
      .sort((a, b) => Date.parse(a.due_at!) - Date.parse(b.due_at!)).slice(0, 60) : [];
    const wanted = new Map(upcoming.map(i => ['pouch-task-' + i.id, i]));
    for (const request of await n.getAllScheduledNotificationsAsync()) {
      if (!request.identifier.startsWith('pouch-task-')) continue;
      const item = wanted.get(request.identifier);
      if (item && request.content.data?.due === item.due_at) wanted.delete(request.identifier);
      else await n.cancelScheduledNotificationAsync(request.identifier);
    }
    for (const [identifier, item] of wanted) {
      await n.scheduleNotificationAsync({ identifier, content: {
        title: 'Pouch reminder', body: 'A task in your calendar is due.', sound: 'default', data: { due: item.due_at },
      }, trigger: { type: n.SchedulableTriggerInputTypes.DATE, date: new Date(item.due_at!), channelId: 'reminders' } });
    }
  };
  pending = pending.catch(() => {}).then(update);
  return pending;
}
