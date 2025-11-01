import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = '@crm_settings';

interface Settings {
  googleMapsApiKey: string;
  cities: string[];
}

const DEFAULT_CITIES = [
  'Αθήνα', 'Θεσσαλονίκη', 'Πάτρα', 'Ηράκλειο', 'Λάρισα', 'Βόλος', 'Ιωάννινα',
  'Καβάλα', 'Χανιά', 'Αγρίνιο', 'Καλαμάτα', 'Κομοτηνή', 'Ξάνθη', 'Σέρρες',
  'Τρίκαλα', 'Χαλκίδα', 'Κατερίνη', 'Άρτα', 'Ρόδος', 'Κέρκυρα', 'Κως',
  'Γλυφάδα', 'Κηφισιά', 'Χαλάνδρι', 'Μαρούσι', 'Περιστέρι', 'Νίκαια',
  'Καλλιθέα', 'Αιγάλεω', 'Πειραιάς', 'Ιλιον', 'Αχαρνές', 'Βριλήσσια',
  'Κορωπί', 'Ελληνικό', 'Άλιμος', 'Παλλήνη', 'Χολαργός', 'Νέα Σμύρνη',
  'Βύρωνας', 'Ζωγράφου', 'Γαλάτσι', 'Αγία Παρασκευή', 'Παλαιό Φάληρο',
  'Καματερό', 'Νέα Φιλαδέλφεια', 'Μεταμόρφωση', 'Πεύκη', 'Ψυχικό',
  'Δραπετσώνα', 'Κερατσίνι', 'Ρέντης', 'Άνω Λιόσια', 'Μενίδι', 'Πεντέλη',
  'Ραφήνα', 'Σπάτα', 'Παιανία', 'Μαραθώνας', 'Λαύριο', 'Κορίνθος',
  'Τρίπολη', 'Μυτιλήνη', 'Σύρος', 'Πάρος', 'Νάξος', 'Μύκονος', 'Σαντορίνη',
].sort((a, b) => a.localeCompare(b, 'el'));

export const [SettingsProvider, useSettings] = createContextHook(() => {
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>('');
  const [cities, setCities] = useState<string[]>(DEFAULT_CITIES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const settings: Settings = JSON.parse(stored);
        setGoogleMapsApiKey(settings.googleMapsApiKey || '');
        const loadedCities = settings.cities || DEFAULT_CITIES;
        setCities([...loadedCities].sort((a, b) => a.localeCompare(b, 'el')));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveGoogleMapsApiKey = useCallback(async (key: string) => {
    try {
      setGoogleMapsApiKey(key);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const currentSettings: Settings = stored ? JSON.parse(stored) : { googleMapsApiKey: '', cities: DEFAULT_CITIES };
      const settings: Settings = { ...currentSettings, googleMapsApiKey: key };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving Google Maps API key:', error);
    }
  }, []);

  const saveCities = useCallback(async (newCities: string[]) => {
    try {
      const sortedCities = [...newCities].sort((a, b) => a.localeCompare(b, 'el'));
      setCities(sortedCities);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const currentSettings: Settings = stored ? JSON.parse(stored) : { googleMapsApiKey: '', cities: DEFAULT_CITIES };
      const settings: Settings = { ...currentSettings, cities: sortedCities };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving cities:', error);
      throw error;
    }
  }, []);

  const addCity = useCallback(async (city: string) => {
    const trimmedCity = city.trim();
    if (!trimmedCity) return;
    
    setCities(currentCities => {
      if (currentCities.includes(trimmedCity)) {
        throw new Error('Η πόλη υπάρχει ήδη');
      }
      const newCities = [...currentCities, trimmedCity].sort((a, b) => a.localeCompare(b, 'el'));
      
      AsyncStorage.getItem(STORAGE_KEY).then(stored => {
        const currentSettings: Settings = stored ? JSON.parse(stored) : { googleMapsApiKey: '', cities: DEFAULT_CITIES };
        const settings: Settings = { ...currentSettings, cities: newCities };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      });
      
      return newCities;
    });
  }, []);

  const removeCity = useCallback(async (city: string) => {
    setCities(currentCities => {
      const newCities = currentCities.filter(c => c !== city).sort((a, b) => a.localeCompare(b, 'el'));
      
      AsyncStorage.getItem(STORAGE_KEY).then(stored => {
        const currentSettings: Settings = stored ? JSON.parse(stored) : { googleMapsApiKey: '', cities: DEFAULT_CITIES };
        const settings: Settings = { ...currentSettings, cities: newCities };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      });
      
      return newCities;
    });
  }, []);

  const updateCity = useCallback(async (oldCity: string, newCity: string) => {
    const trimmedNewCity = newCity.trim();
    if (!trimmedNewCity) return;
    
    setCities(currentCities => {
      if (currentCities.includes(trimmedNewCity) && oldCity !== trimmedNewCity) {
        throw new Error('Η πόλη υπάρχει ήδη');
      }
      const newCities = currentCities.map(c => c === oldCity ? trimmedNewCity : c).sort((a, b) => a.localeCompare(b, 'el'));
      
      AsyncStorage.getItem(STORAGE_KEY).then(stored => {
        const currentSettings: Settings = stored ? JSON.parse(stored) : { googleMapsApiKey: '', cities: DEFAULT_CITIES };
        const settings: Settings = { ...currentSettings, cities: newCities };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      });
      
      return newCities;
    });
  }, []);

  return useMemo(() => ({
    googleMapsApiKey,
    saveGoogleMapsApiKey,
    cities,
    saveCities,
    addCity,
    removeCity,
    updateCity,
    isLoading,
  }), [googleMapsApiKey, saveGoogleMapsApiKey, cities, saveCities, addCity, removeCity, updateCity, isLoading]);
});
