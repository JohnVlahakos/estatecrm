import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useState, useEffect } from 'react';

const STORAGE_KEYS = {
  LAST_MATCHES_SEEN: '@last_matches_seen',
  LAST_APPOINTMENTS_SEEN: '@last_appointments_seen',
};

export const [NotificationBadgeProvider, useNotificationBadges] = createContextHook(() => {
  const [matchesCount, setMatchesCount] = useState<number>(0);
  const [appointmentsCount, setAppointmentsCount] = useState<number>(0);
  const [lastMatchesSeen, setLastMatchesSeen] = useState<number>(0);
  const [lastAppointmentsSeen, setLastAppointmentsSeen] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    const loadLastSeen = async () => {
      try {
        const [matchesSeenStr, appointmentsSeenStr] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.LAST_MATCHES_SEEN),
          AsyncStorage.getItem(STORAGE_KEYS.LAST_APPOINTMENTS_SEEN),
        ]);
        
        if (matchesSeenStr) {
          setLastMatchesSeen(parseInt(matchesSeenStr, 10));
        }
        if (appointmentsSeenStr) {
          setLastAppointmentsSeen(parseInt(appointmentsSeenStr, 10));
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading last seen data:', error);
        setIsInitialized(true);
      }
    };
    loadLastSeen();
  }, []);

  const updateMatchesCount = useCallback((totalCount: number) => {
    if (isInitialized) {
      const newMatches = Math.max(0, totalCount - lastMatchesSeen);
      console.log('Updating matches badge:', { totalCount, lastMatchesSeen, newMatches });
      setMatchesCount(newMatches);
    }
  }, [lastMatchesSeen, isInitialized]);

  const updateAppointmentsCount = useCallback((totalCount: number) => {
    if (isInitialized) {
      const newAppointments = Math.max(0, totalCount - lastAppointmentsSeen);
      console.log('Updating appointments badge:', { totalCount, lastAppointmentsSeen, newAppointments });
      setAppointmentsCount(newAppointments);
    }
  }, [lastAppointmentsSeen, isInitialized]);

  const clearMatchesBadge = useCallback(async (currentTotal: number) => {
    console.log('Clearing matches badge, setting last seen to:', currentTotal);
    setMatchesCount(0);
    setLastMatchesSeen(currentTotal);
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_MATCHES_SEEN, currentTotal.toString());
  }, []);

  const clearAppointmentsBadge = useCallback(async (currentTotal: number) => {
    console.log('Clearing appointments badge, setting last seen to:', currentTotal);
    setAppointmentsCount(0);
    setLastAppointmentsSeen(currentTotal);
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_APPOINTMENTS_SEEN, currentTotal.toString());
  }, []);

  return {
    matchesCount,
    appointmentsCount,
    updateMatchesCount,
    updateAppointmentsCount,
    clearMatchesBadge,
    clearAppointmentsBadge,
    isInitialized,
  };
});
