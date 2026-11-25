import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { radii, shadows, spacing, useThemeColors } from '@/constants/ui';

interface DateFieldProps {
  label: string;
  value: Date;
  mode?: 'date' | 'time';
  onChange: (date: Date) => void;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function toDateInputValue(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function DateField({ label, value, onChange, mode = 'date' }: DateFieldProps) {
  const colorScheme = useColorScheme();
  const theme = useThemeColors(colorScheme === 'dark');
  const [open, setOpen] = useState(false);


  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
    }
    if (event.type === 'dismissed' || !selected) {
      return;
    }
    onChange(selected);
  };

  return (
    <View style={[styles.container, shadows.card, { backgroundColor: theme.surface }]}>
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      {Platform.OS === 'web' ? (
        <input aria-label={label} type={mode} value={mode === 'date' ? toDateInputValue(value) : value.toTimeString().slice(0, 5)}
          onChange={(event) => {
            if (!event.target.value) return;
            const next = new Date(mode === 'date' ? event.target.value + 'T' + value.toTimeString().slice(0, 8)
              : toDateInputValue(value) + 'T' + event.target.value);
            if (Number.isFinite(next.getTime())) onChange(next);
          }} />
      ) : (
        <>
          <PressableScale scaleTo={0.98} onPress={() => setOpen(!open)}>
            <Text style={[styles.value, { color: theme.text }]}>{mode === 'date' ? formatDate(value) : value.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
          </PressableScale>
          {open ? (
            <DateTimePicker
              mode={mode}
              value={value}
              onChange={handleChange}
              display={Platform.OS === 'ios' ? (mode === 'time' ? 'spinner' : 'inline') : 'default'}
            />
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    gap: spacing.sm,
    padding: spacing.md + 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  webInput: {
    borderRadius: radii.md,
    borderWidth: 1.5,
    fontSize: 15,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
});
