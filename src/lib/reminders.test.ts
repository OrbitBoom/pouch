import { syncReminders } from './reminders';
import type { Item } from '@/types/item';
import * as notifications from 'expo-notifications';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(async () => ({ granted: true })),
  setNotificationHandler: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

it('keeps existing alarms, replaces changed times and cancels completed or other-account tasks', async () => {
  const due = new Date(Date.now() + 3600000).toISOString();
  const task = (id: string, user_id = 'me', done = false) => ({ id, user_id, type: 'task', due_at: due, done }) as Item;
  const requests = ['keep', 'changed', 'done', 'other'].map(id => ({
    identifier: 'pouch-task-' + id, content: { data: { due: id === 'changed' ? 'old' : due } },
  }));
  (notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(requests);
  await syncReminders('me', [task('keep'), task('changed'), task('done', 'me', true), task('other', 'them')]);
  expect((notifications.cancelScheduledNotificationAsync as jest.Mock).mock.calls.flat()).toEqual(['pouch-task-changed', 'pouch-task-done', 'pouch-task-other']);
  expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  expect(notifications.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({ identifier: 'pouch-task-changed' }));
});
