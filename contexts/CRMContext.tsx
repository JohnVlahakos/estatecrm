import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Client, Property, Appointment } from '@/types';
import { mockClients, mockProperties, mockAppointments } from '@/utils/mockData';
import { schedulePropertyAvailabilityNotification, cancelScheduledNotification } from '@/utils/notifications';

const STORAGE_KEYS = {
  CLIENTS: '@crm_clients',
  PROPERTIES: '@crm_properties',
  APPOINTMENTS: '@crm_appointments',
};

export const [CRMProvider, useCRM] = createContextHook(() => {
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clientsData, propertiesData, appointmentsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CLIENTS),
        AsyncStorage.getItem(STORAGE_KEYS.PROPERTIES),
        AsyncStorage.getItem(STORAGE_KEYS.APPOINTMENTS),
      ]);

      if (clientsData) {
        setClients(JSON.parse(clientsData));
      } else {
        setClients(mockClients);
        await AsyncStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(mockClients));
      }

      if (propertiesData) {
        setProperties(JSON.parse(propertiesData));
      } else {
        setProperties(mockProperties);
        await AsyncStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(mockProperties));
      }

      if (appointmentsData) {
        setAppointments(JSON.parse(appointmentsData));
      } else {
        setAppointments(mockAppointments);
        await AsyncStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(mockAppointments));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveClients = async (newClients: Client[]) => {
    setClients(newClients);
    await AsyncStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(newClients));
  };

  const saveProperties = async (newProperties: Property[]) => {
    setProperties(newProperties);
    await AsyncStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(newProperties));
  };

  const saveAppointments = async (newAppointments: Appointment[]) => {
    setAppointments(newAppointments);
    await AsyncStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(newAppointments));
  };

  const addClient = useCallback(async (client: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...client,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    await saveClients([...clients, newClient]);
  }, [clients]);

  const updateClient = useCallback(async (id: string, updates: Partial<Client>) => {
    const updated = clients.map(c => c.id === id ? { ...c, ...updates } : c);
    await saveClients(updated);
  }, [clients]);

  const deleteClient = useCallback(async (id: string) => {
    await saveClients(clients.filter(c => c.id !== id));
  }, [clients]);

  const addProperty = useCallback(async (property: Omit<Property, 'id' | 'createdAt'>) => {
    const newProperty: Property = {
      ...property,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setProperties(currentProperties => {
      const updated = [...currentProperties, newProperty];
      AsyncStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateProperty = useCallback(async (id: string, updates: Partial<Property>) => {
    setProperties(currentProperties => {
      const property = currentProperties.find(p => p.id === id);
      if (!property) return currentProperties;

      const oldNotificationId = property.rentalInfo?.notificationId;
      let updatedProperty = { ...property, ...updates };

      if (oldNotificationId && updates.rentalInfo?.notificationId !== oldNotificationId) {
        cancelScheduledNotification(oldNotificationId);
      }

      if (updates.status === 'rented' && updates.rentalInfo?.availabilityDate) {
        const availabilityDate = new Date(updates.rentalInfo.availabilityDate);
        schedulePropertyAvailabilityNotification(
          updatedProperty.title,
          availabilityDate
        ).then(notificationId => {
          if (notificationId) {
            const finalProperty = {
              ...updatedProperty,
              rentalInfo: {
                ...updatedProperty.rentalInfo,
                ...updates.rentalInfo,
                notificationScheduled: true,
                notificationId,
              },
            };
            setProperties(props => {
              const finalUpdated = props.map(p => p.id === id ? finalProperty : p);
              AsyncStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(finalUpdated));
              return finalUpdated;
            });
          }
        });
      }

      const updated = currentProperties.map(p => p.id === id ? updatedProperty : p);
      AsyncStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteProperty = useCallback(async (id: string) => {
    await saveProperties(properties.filter(p => p.id !== id));
  }, [properties]);

  const addAppointment = useCallback(async (appointment: Omit<Appointment, 'id' | 'createdAt'>) => {
    const newAppointment: Appointment = {
      ...appointment,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    await saveAppointments([...appointments, newAppointment]);
  }, [appointments]);

  const updateAppointment = useCallback(async (id: string, updates: Partial<Appointment>) => {
    const updated = appointments.map(a => a.id === id ? { ...a, ...updates } : a);
    await saveAppointments(updated);
  }, [appointments]);

  const deleteAppointment = useCallback(async (id: string) => {
    await saveAppointments(appointments.filter(a => a.id !== id));
  }, [appointments]);

  const getClientById = useCallback((id: string) => clients.find(c => c.id === id), [clients]);
  const getPropertyById = useCallback((id: string) => properties.find(p => p.id === id), [properties]);
  const getAppointmentById = useCallback((id: string) => appointments.find(a => a.id === id), [appointments]);

  const calculateMatchScore = useCallback((client: Client, property: Property): number => {
    const normalizeLocation = (location: string): string => {
      return location
        .toLowerCase()
        .trim()
        .replace(/[,;.\s]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const calculateLocationMatch = (clientLocations: string[] | undefined, clientLocation: string | undefined, propertyLocation: string): number => {
      if (!propertyLocation) return 0;
      
      const propertyNormalized = normalizeLocation(propertyLocation);
      
      if (clientLocations && clientLocations.length > 0) {
        for (const loc of clientLocations) {
          const clientNormalized = normalizeLocation(loc);
          if (clientNormalized === propertyNormalized) {
            return 8;
          }
        }
        return 0;
      }
      
      if (clientLocation) {
        const clientNormalized = normalizeLocation(clientLocation);
        if (clientNormalized === propertyNormalized) {
          return 8;
        }
        return 0;
      }

      return 0;
    };
    let score = 0;
    let maxScore = 0;

    if (client.budgetMin !== undefined || client.budgetMax !== undefined) {
      maxScore += 20;
      const withinBudget = 
        (client.budgetMin === undefined || property.price >= client.budgetMin) &&
        (client.budgetMax === undefined || property.price <= client.budgetMax);
      if (withinBudget) score += 20;
    }

    if (client.desiredPropertyType) {
      maxScore += 12;
      if (property.type === client.desiredPropertyType) score += 12;
    }

    if (client.desiredLocations && client.desiredLocations.length > 0) {
      maxScore += 8;
      const locationScore = calculateLocationMatch(client.desiredLocations, undefined, property.location);
      score += locationScore;
    } else if (client.desiredLocation) {
      maxScore += 8;
      const locationScore = calculateLocationMatch(undefined, client.desiredLocation, property.location);
      score += locationScore;
    }

    if (client.minSize !== undefined || client.maxSize !== undefined) {
      maxScore += 6;
      const withinSize = 
        (client.minSize === undefined || property.size >= client.minSize) &&
        (client.maxSize === undefined || property.size <= client.maxSize);
      if (withinSize) score += 6;
    }

    if (client.minBedrooms !== undefined || client.maxBedrooms !== undefined) {
      maxScore += 6;
      const withinBedrooms = 
        (client.minBedrooms === undefined || (property.bedrooms || 0) >= client.minBedrooms) &&
        (client.maxBedrooms === undefined || (property.bedrooms || 0) <= client.maxBedrooms);
      if (withinBedrooms) score += 6;
    }

    if (client.minBathrooms !== undefined || client.maxBathrooms !== undefined) {
      maxScore += 3;
      const withinBathrooms = 
        (client.minBathrooms === undefined || (property.bathrooms || 0) >= client.minBathrooms) &&
        (client.maxBathrooms === undefined || (property.bathrooms || 0) <= client.maxBathrooms);
      if (withinBathrooms) score += 3;
    }

    if (client.preferences && property.features) {
      maxScore += 15;
      let matchingFeatures = 0;
      let totalPreferences = 0;

      Object.keys(client.preferences).forEach((key) => {
        const prefKey = key as keyof typeof client.preferences;
        if (client.preferences && client.preferences[prefKey] === true) {
          totalPreferences++;
          if (property.features && property.features[prefKey] === true) {
            matchingFeatures++;
          }
        }
      });

      if (totalPreferences > 0) {
        score += (matchingFeatures / totalPreferences) * 15;
      } else {
        score += 15;
      }
    }

    if (property.status !== 'active') {
      score *= 0.5;
    }

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }, []);

  const getMatchedProperties = useCallback((clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return [];

    const matchedProperties = properties.map(property => ({
      property,
      matchScore: calculateMatchScore(client, property),
    }));

    return matchedProperties
      .filter(m => m.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [clients, properties, calculateMatchScore]);

  return useMemo(() => ({
    clients,
    properties,
    appointments,
    isLoading,
    addClient,
    updateClient,
    deleteClient,
    addProperty,
    updateProperty,
    deleteProperty,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getClientById,
    getPropertyById,
    getAppointmentById,
    calculateMatchScore,
    getMatchedProperties,
  }), [
    clients,
    properties,
    appointments,
    isLoading,
    addClient,
    updateClient,
    deleteClient,
    addProperty,
    updateProperty,
    deleteProperty,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getClientById,
    getPropertyById,
    getAppointmentById,
    calculateMatchScore,
    getMatchedProperties,
  ]);
});
