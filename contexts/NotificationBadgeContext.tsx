import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useState } from 'react';

const STORAGE_KEYS = {
  LAST_MATCHES_CHECK: '@last_matches_check',
  LAST_APPOINTMENTS_CHECK: '@last_appointments_check',
};

export const [NotificationBadgeProvider, useNotificationBadges] = createContextHook(() => {
  const [matchesCount, setMatchesCount] = useState<number>(0);
  const [appointmentsCount, setAppointmentsCount] = useState<number>(0);

  const updateMatchesCount = useCallback((count: number) => {
    setMatchesCount(count);
  }, []);

  const updateAppointmentsCount = useCallback((count: number) => {
    setAppointmentsCount(count);
  }, []);

  const clearMatchesBadge = useCallback(async () => {
    setMatchesCount(0);
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_MATCHES_CHECK, Date.now().toString());
  }, []);

  const clearAppointmentsBadge = useCallback(async () => {
    setAppointmentsCount(0);
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_APPOINTMENTS_CHECK, Date.now().toString());
  }, []);

  return {
    matchesCount,
    appointmentsCount,
    updateMatchesCount,
    updateAppointmentsCount,
    clearMatchesBadge,
    clearAppointmentsBadge,
  };
});
