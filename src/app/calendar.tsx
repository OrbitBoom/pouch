import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Linking, Platform, Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { SettingsCard, ActionButton } from '@/components/settings-ui';
import { useThemeColors } from '@/constants/ui';
import { useItems } from '@/contexts/ItemsContext';
import { useAuth } from '@/contexts/AuthContext';
import { reminderPermission, syncReminders } from '@/lib/reminders';

export default function Calendar() {
  const colors = useThemeColors(useColorScheme() === 'dark');
  const { items } = useItems();
  const { user } = useAuth();
  const router = useRouter();
  const [day, select] = useState(() => new Date());
  const [status, setStatus] = useState('');
  const [denied, setDenied] = useState(false);
  const tasks = items.filter(i => i.type === 'task' && !i.done && i.due_at)
    .sort((a, b) => Date.parse(a.due_at!) - Date.parse(b.due_at!));
  const tasksOn = (date: Date) => tasks.filter(i => new Date(i.due_at!).toDateString() === date.toDateString());
  const first = new Date(day.getFullYear(), day.getMonth(), 1);
  const days = new Date(day.getFullYear(), day.getMonth() + 1, 0).getDate();
  const move = (delta: number) => select(new Date(day.getFullYear(), day.getMonth() + delta, 1));
  const enable = async () => {
    try {
      const allowed = await reminderPermission(true);
      setDenied(!allowed);
      if (allowed) await syncReminders(user?.id, items);
      setStatus(allowed ? 'Alerts are enabled on this device.' : 'Allow notifications in device settings to receive alerts.');
    } catch { setStatus('Couldn’t schedule alerts. Try again.'); }
  };
  return <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
    <SettingsCard title={day.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {[['Previous month', () => move(-1)], ['Today', () => select(new Date())], ['Next month', () => move(1)]] .map(([label, fn]) =>
          <Text accessibilityRole="button" key={String(label)} style={{ color: colors.accent, paddingVertical: 8 }} onPress={fn as () => void}>{String(label)}</Text>)}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(s => <Text key={s} style={{ width: '14.28%', textAlign: 'center', color: colors.textMuted }}>{s}</Text>)}
        {Array.from({ length: first.getDay() + days }, (_, ix) => {
          const d = ix - first.getDay() + 1;
          if (d < 1) return <View key={ix} style={{ width: '14.28%' }} />;
          const date = new Date(day.getFullYear(), day.getMonth(), d);
          const count = tasksOn(date).length;
          return <Pressable key={ix} accessibilityRole="button" accessibilityState={{ selected: d === day.getDate() }}
            accessibilityLabel={date.toDateString() + ', ' + count + ' reminders'} onPress={() => select(date)}
            style={{ width: '14.28%', height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: d === day.getDate() ? colors.accentMuted : 'transparent' }}>
            <Text style={{ color: colors.text }}>{d}</Text>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: count ? colors.accent : 'transparent' }} />
          </Pressable>;
        })}
      </View>
    </SettingsCard>
    <SettingsCard title={day.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}>
      {tasksOn(day).map(i => <Pressable key={i.id} accessibilityRole="button" onPress={() => router.push(`/item/${i.id}`)}>
        <Text style={{ color: colors.accent }}>{new Date(i.due_at!).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
        <Text style={{ color: colors.text, paddingVertical: 6 }}>{i.content}</Text>
      </Pressable>)}
      {!tasksOn(day).length && <Text style={{ color: colors.textMuted }}>No reminders for this day. Give a task a due date and time to add it here.</Text>}
    </SettingsCard>
    {Platform.OS !== 'web' && <SettingsCard title="Device alerts">
      <Text style={{ color: colors.textMuted }}>Pouch schedules your next 60 upcoming tasks when you open or sync the app.</Text>
      <ActionButton label="Enable task alerts" onPress={() => void enable()} />
      {status && <Text accessibilityLiveRegion="polite" style={{ color: colors.text }}>{status}</Text>}
      {denied && <ActionButton secondary label="Open settings" onPress={() => void Linking.openSettings()} />}
    </SettingsCard>}
  </ScrollView>;
}
