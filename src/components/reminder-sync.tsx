import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useItems } from '@/contexts/ItemsContext';
import { syncReminders } from '@/lib/reminders';

export function ReminderSync() {
  const { user } = useAuth();
  const { items, loading } = useItems();
  useEffect(() => {
    if (Platform.OS === 'web' || (user && loading)) return;
    const sync = () => { void syncReminders(user?.id, items).catch(() => console.warn('Could not schedule calendar reminders')); };
    sync();
    const sub = AppState.addEventListener('change', state => { if (state === 'active') sync(); });
    return () => sub.remove();
  }, [items, loading, user]);
  return null;
}
