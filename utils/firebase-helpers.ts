import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  Timestamp,
  writeBatch,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type {
  Client,
  Property,
  Appointment,
  User,
  SubscriptionPlan,
  UserSubscription,
  MatchView,
  ClientStatus,
  ClientCategory,
  PropertyType,
  PropertyStatus,
  AppointmentType,
  UserRole,
  UserStatus,
  SubscriptionStatus
} from '@/types';



const convertTimestampToISO = (timestamp: any): string => {
  if (!timestamp) return new Date().toISOString();
  if (typeof timestamp === 'string') return timestamp;
  if (timestamp instanceof Date) return timestamp.toISOString();
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toISOString();
  }
  return new Date().toISOString();
};

const convertISOToTimestamp = (isoString: string): Timestamp => {
  return Timestamp.fromDate(new Date(isoString));
};

export const COLLECTIONS = {
  USERS: 'users',
  CLIENTS: 'clients',
  PROPERTIES: 'properties',
  APPOINTMENTS: 'appointments',
  SUBSCRIPTION_PLANS: 'subscriptionPlans',
  USER_SUBSCRIPTIONS: 'userSubscriptions',
  MATCH_VIEWS: 'matchViews',
  EXCLUDED_MATCHES: 'excludedMatches',
} as const;

// ============================================
// USER HELPERS
// ============================================

export const createUser = async (userId: string, userData: Omit<User, 'id'>): Promise<void> => {
  await setDoc(doc(db, COLLECTIONS.USERS, userId), userData);
};

export const getUser = async (userId: string): Promise<User | null> => {
  const docSnap = await getDoc(doc(db, COLLECTIONS.USERS, userId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as User;
};

export const updateUser = async (userId: string, updates: Partial<Omit<User, 'id'>>): Promise<void> => {
  await updateDoc(doc(db, COLLECTIONS.USERS, userId), updates);
};

export const deleteUser = async (userId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
};

export const getAllUsers = async (): Promise<User[]> => {
  const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
};

export const getUsersByStatus = async (status: UserStatus): Promise<User[]> => {
  const q = query(collection(db, COLLECTIONS.USERS), where('status', '==', status));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
};

export const getUsersByRole = async (role: UserRole): Promise<User[]> => {
  const q = query(collection(db, COLLECTIONS.USERS), where('role', '==', role));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
};

// ============================================
// CLIENT HELPERS
// ============================================

export const createClient = async (userId: string, clientData: Omit<Client, 'id' | 'createdAt'>): Promise<string> => {
  const newClient = {
    ...clientData,
    userId,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.CLIENTS), newClient);
  return docRef.id;
};

export const getClient = async (clientId: string): Promise<Client | null> => {
  const docSnap = await getDoc(doc(db, COLLECTIONS.CLIENTS, clientId));
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: convertTimestampToISO(data.createdAt),
    lastContact: data.lastContact ? convertTimestampToISO(data.lastContact) : undefined,
  } as Client;
};

export const updateClient = async (clientId: string, updates: Partial<Omit<Client, 'id' | 'createdAt'>>): Promise<void> => {
  const updateData: any = { ...updates };
  if (updates.lastContact) {
    updateData.lastContact = convertISOToTimestamp(updates.lastContact);
  }
  await updateDoc(doc(db, COLLECTIONS.CLIENTS, clientId), updateData);
};

export const deleteClient = async (clientId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.CLIENTS, clientId));
};

export const getClientsByUser = async (userId: string): Promise<Client[]> => {
  const q = query(
    collection(db, COLLECTIONS.CLIENTS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestampToISO(data.createdAt),
      lastContact: data.lastContact ? convertTimestampToISO(data.lastContact) : undefined,
    } as Client;
  });
};

export const getClientsByStatus = async (userId: string, status: ClientStatus): Promise<Client[]> => {
  const q = query(
    collection(db, COLLECTIONS.CLIENTS),
    where('userId', '==', userId),
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestampToISO(data.createdAt),
      lastContact: data.lastContact ? convertTimestampToISO(data.lastContact) : undefined,
    } as Client;
  });
};

export const getClientsByCategory = async (userId: string, category: ClientCategory): Promise<Client[]> => {
  const q = query(
    collection(db, COLLECTIONS.CLIENTS),
    where('userId', '==', userId),
    where('category', '==', category),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestampToISO(data.createdAt),
      lastContact: data.lastContact ? convertTimestampToISO(data.lastContact) : undefined,
    } as Client;
  });
};

export const searchClients = async (userId: string, searchTerm: string): Promise<Client[]> => {
  const allClients = await getClientsByUser(userId);
  const lowerSearch = searchTerm.toLowerCase();
  return allClients.filter(client =>
    client.name.toLowerCase().includes(lowerSearch) ||
    client.email.toLowerCase().includes(lowerSearch) ||
    client.phone.includes(searchTerm)
  );
};

// ============================================
// PROPERTY HELPERS
// ============================================

export const createProperty = async (userId: string, propertyData: Omit<Property, 'id' | 'createdAt'>): Promise<string> => {
  const newProperty = {
    ...propertyData,
    userId,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.PROPERTIES), newProperty);
  return docRef.id;
};

export const getProperty = async (propertyId: string): Promise<Property | null> => {
  const docSnap = await getDoc(doc(db, COLLECTIONS.PROPERTIES, propertyId));
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: convertTimestampToISO(data.createdAt),
    rentalInfo: data.rentalInfo ? {
      ...data.rentalInfo,
      rentedDate: data.rentalInfo.rentedDate ? convertTimestampToISO(data.rentalInfo.rentedDate) : undefined,
      availabilityDate: data.rentalInfo.availabilityDate ? convertTimestampToISO(data.rentalInfo.availabilityDate) : undefined,
    } : undefined,
  } as Property;
};

export const updateProperty = async (propertyId: string, updates: Partial<Omit<Property, 'id' | 'createdAt'>>): Promise<void> => {
  const updateData: any = { ...updates };
  if (updates.rentalInfo) {
    updateData.rentalInfo = { ...updates.rentalInfo };
    if (updates.rentalInfo.rentedDate) {
      updateData.rentalInfo.rentedDate = convertISOToTimestamp(updates.rentalInfo.rentedDate);
    }
    if (updates.rentalInfo.availabilityDate) {
      updateData.rentalInfo.availabilityDate = convertISOToTimestamp(updates.rentalInfo.availabilityDate);
    }
  }
  await updateDoc(doc(db, COLLECTIONS.PROPERTIES, propertyId), updateData);
};

export const deleteProperty = async (propertyId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.PROPERTIES, propertyId));
};

export const getPropertiesByUser = async (userId: string): Promise<Property[]> => {
  const q = query(
    collection(db, COLLECTIONS.PROPERTIES),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestampToISO(data.createdAt),
      rentalInfo: data.rentalInfo ? {
        ...data.rentalInfo,
        rentedDate: data.rentalInfo.rentedDate ? convertTimestampToISO(data.rentalInfo.rentedDate) : undefined,
        availabilityDate: data.rentalInfo.availabilityDate ? convertTimestampToISO(data.rentalInfo.availabilityDate) : undefined,
      } : undefined,
    } as Property;
  });
};

export const getPropertiesByStatus = async (userId: string, status: PropertyStatus): Promise<Property[]> => {
  const q = query(
    collection(db, COLLECTIONS.PROPERTIES),
    where('userId', '==', userId),
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestampToISO(data.createdAt),
      rentalInfo: data.rentalInfo ? {
        ...data.rentalInfo,
        rentedDate: data.rentalInfo.rentedDate ? convertTimestampToISO(data.rentalInfo.rentedDate) : undefined,
        availabilityDate: data.rentalInfo.availabilityDate ? convertTimestampToISO(data.rentalInfo.availabilityDate) : undefined,
      } : undefined,
    } as Property;
  });
};

export const getPropertiesByType = async (userId: string, type: PropertyType): Promise<Property[]> => {
  const q = query(
    collection(db, COLLECTIONS.PROPERTIES),
    where('userId', '==', userId),
    where('type', '==', type),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestampToISO(data.createdAt),
      rentalInfo: data.rentalInfo ? {
        ...data.rentalInfo,
        rentedDate: data.rentalInfo.rentedDate ? convertTimestampToISO(data.rentalInfo.rentedDate) : undefined,
        availabilityDate: data.rentalInfo.availabilityDate ? convertTimestampToISO(data.rentalInfo.availabilityDate) : undefined,
      } : undefined,
    } as Property;
  });
};

export const searchProperties = async (userId: string, searchTerm: string): Promise<Property[]> => {
  const allProperties = await getPropertiesByUser(userId);
  const lowerSearch = searchTerm.toLowerCase();
  return allProperties.filter(property =>
    property.title.toLowerCase().includes(lowerSearch) ||
    property.location.toLowerCase().includes(lowerSearch) ||
    property.description.toLowerCase().includes(lowerSearch)
  );
};

export const getPropertiesByPriceRange = async (
  userId: string,
  minPrice: number,
  maxPrice: number
): Promise<Property[]> => {
  const q = query(
    collection(db, COLLECTIONS.PROPERTIES),
    where('userId', '==', userId),
    where('price', '>=', minPrice),
    where('price', '<=', maxPrice),
    orderBy('price', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestampToISO(data.createdAt),
      rentalInfo: data.rentalInfo ? {
        ...data.rentalInfo,
        rentedDate: data.rentalInfo.rentedDate ? convertTimestampToISO(data.rentalInfo.rentedDate) : undefined,
        availabilityDate: data.rentalInfo.availabilityDate ? convertTimestampToISO(data.rentalInfo.availabilityDate) : undefined,
      } : undefined,
    } as Property;
  });
};

// ============================================
// APPOINTMENT HELPERS
// ============================================

export const createAppointment = async (userId: string, appointmentData: Omit<Appointment, 'id' | 'createdAt'>): Promise<string> => {
  const newAppointment = {
    ...appointmentData,
    userId,
    date: convertISOToTimestamp(appointmentData.date),
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.APPOINTMENTS), newAppointment);
  return docRef.id;
};

export const getAppointment = async (appointmentId: string): Promise<Appointment | null> => {
  const docSnap = await getDoc(doc(db, COLLECTIONS.APPOINTMENTS, appointmentId));
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    date: convertTimestampToISO(data.date),
    createdAt: convertTimestampToISO(data.createdAt),
  } as Appointment;
};

export const updateAppointment = async (appointmentId: string, updates: Partial<Omit<Appointment, 'id' | 'createdAt'>>): Promise<void> => {
  const updateData: any = { ...updates };
  if (updates.date) {
    updateData.date = convertISOToTimestamp(updates.date);
  }
  await updateDoc(doc(db, COLLECTIONS.APPOINTMENTS, appointmentId), updateData);
};

export const deleteAppointment = async (appointmentId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.APPOINTMENTS, appointmentId));
};

export const getAppointmentsByUser = async (userId: string): Promise<Appointment[]> => {
  const q = query(
    collection(db, COLLECTIONS.APPOINTMENTS),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: convertTimestampToISO(data.date),
      createdAt: convertTimestampToISO(data.createdAt),
    } as Appointment;
  });
};

export const getAppointmentsByClient = async (userId: string, clientId: string): Promise<Appointment[]> => {
  const q = query(
    collection(db, COLLECTIONS.APPOINTMENTS),
    where('userId', '==', userId),
    where('clientId', '==', clientId),
    orderBy('date', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: convertTimestampToISO(data.date),
      createdAt: convertTimestampToISO(data.createdAt),
    } as Appointment;
  });
};

export const getAppointmentsByProperty = async (userId: string, propertyId: string): Promise<Appointment[]> => {
  const q = query(
    collection(db, COLLECTIONS.APPOINTMENTS),
    where('userId', '==', userId),
    where('propertyId', '==', propertyId),
    orderBy('date', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: convertTimestampToISO(data.date),
      createdAt: convertTimestampToISO(data.createdAt),
    } as Appointment;
  });
};

export const getUpcomingAppointments = async (userId: string): Promise<Appointment[]> => {
  const now = Timestamp.now();
  const q = query(
    collection(db, COLLECTIONS.APPOINTMENTS),
    where('userId', '==', userId),
    where('date', '>=', now),
    where('completed', '==', false),
    orderBy('date', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: convertTimestampToISO(data.date),
      createdAt: convertTimestampToISO(data.createdAt),
    } as Appointment;
  });
};

export const getCompletedAppointments = async (userId: string): Promise<Appointment[]> => {
  const q = query(
    collection(db, COLLECTIONS.APPOINTMENTS),
    where('userId', '==', userId),
    where('completed', '==', true),
    orderBy('date', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: convertTimestampToISO(data.date),
      createdAt: convertTimestampToISO(data.createdAt),
    } as Appointment;
  });
};

export const getAppointmentsByType = async (userId: string, type: AppointmentType): Promise<Appointment[]> => {
  const q = query(
    collection(db, COLLECTIONS.APPOINTMENTS),
    where('userId', '==', userId),
    where('type', '==', type),
    orderBy('date', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: convertTimestampToISO(data.date),
      createdAt: convertTimestampToISO(data.createdAt),
    } as Appointment;
  });
};

// ============================================
// SUBSCRIPTION PLAN HELPERS
// ============================================

export const createSubscriptionPlan = async (planData: Omit<SubscriptionPlan, 'id' | 'createdAt'>): Promise<string> => {
  const newPlan = {
    ...planData,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.SUBSCRIPTION_PLANS), newPlan);
  return docRef.id;
};

export const getSubscriptionPlan = async (planId: string): Promise<SubscriptionPlan | null> => {
  const docSnap = await getDoc(doc(db, COLLECTIONS.SUBSCRIPTION_PLANS, planId));
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: convertTimestampToISO(data.createdAt),
  } as SubscriptionPlan;
};

export const updateSubscriptionPlan = async (planId: string, updates: Partial<Omit<SubscriptionPlan, 'id' | 'createdAt'>>): Promise<void> => {
  await updateDoc(doc(db, COLLECTIONS.SUBSCRIPTION_PLANS, planId), updates);
};

export const deleteSubscriptionPlan = async (planId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.SUBSCRIPTION_PLANS, planId));
};

export const getAllSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const q = query(collection(db, COLLECTIONS.SUBSCRIPTION_PLANS), orderBy('price', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestampToISO(data.createdAt),
    } as SubscriptionPlan;
  });
};

export const getActiveSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const q = query(
    collection(db, COLLECTIONS.SUBSCRIPTION_PLANS),
    where('isActive', '==', true),
    orderBy('price', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestampToISO(data.createdAt),
    } as SubscriptionPlan;
  });
};

// ============================================
// USER SUBSCRIPTION HELPERS
// ============================================

export const createUserSubscription = async (subscriptionData: Omit<UserSubscription, 'id' | 'createdAt'>): Promise<string> => {
  const newSubscription = {
    ...subscriptionData,
    startDate: convertISOToTimestamp(subscriptionData.startDate),
    endDate: convertISOToTimestamp(subscriptionData.endDate),
    trialEndDate: convertISOToTimestamp(subscriptionData.trialEndDate),
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.USER_SUBSCRIPTIONS), newSubscription);
  return docRef.id;
};

export const getUserSubscription = async (subscriptionId: string): Promise<UserSubscription | null> => {
  const docSnap = await getDoc(doc(db, COLLECTIONS.USER_SUBSCRIPTIONS, subscriptionId));
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    startDate: convertTimestampToISO(data.startDate),
    endDate: convertTimestampToISO(data.endDate),
    trialEndDate: convertTimestampToISO(data.trialEndDate),
    createdAt: convertTimestampToISO(data.createdAt),
  } as UserSubscription;
};

export const getUserSubscriptionByUserId = async (userId: string): Promise<UserSubscription | null> => {
  const q = query(
    collection(db, COLLECTIONS.USER_SUBSCRIPTIONS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    firestoreLimit(1)
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  const doc = querySnapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    startDate: convertTimestampToISO(data.startDate),
    endDate: convertTimestampToISO(data.endDate),
    trialEndDate: convertTimestampToISO(data.trialEndDate),
    createdAt: convertTimestampToISO(data.createdAt),
  } as UserSubscription;
};

export const updateUserSubscription = async (subscriptionId: string, updates: Partial<Omit<UserSubscription, 'id' | 'createdAt'>>): Promise<void> => {
  const updateData: any = { ...updates };
  if (updates.startDate) {
    updateData.startDate = convertISOToTimestamp(updates.startDate);
  }
  if (updates.endDate) {
    updateData.endDate = convertISOToTimestamp(updates.endDate);
  }
  if (updates.trialEndDate) {
    updateData.trialEndDate = convertISOToTimestamp(updates.trialEndDate);
  }
  await updateDoc(doc(db, COLLECTIONS.USER_SUBSCRIPTIONS, subscriptionId), updateData);
};

export const deleteUserSubscription = async (subscriptionId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.USER_SUBSCRIPTIONS, subscriptionId));
};

export const getAllUserSubscriptions = async (): Promise<UserSubscription[]> => {
  const q = query(collection(db, COLLECTIONS.USER_SUBSCRIPTIONS), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: convertTimestampToISO(data.startDate),
      endDate: convertTimestampToISO(data.endDate),
      trialEndDate: convertTimestampToISO(data.trialEndDate),
      createdAt: convertTimestampToISO(data.createdAt),
    } as UserSubscription;
  });
};

export const getSubscriptionsByStatus = async (status: SubscriptionStatus): Promise<UserSubscription[]> => {
  const q = query(
    collection(db, COLLECTIONS.USER_SUBSCRIPTIONS),
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: convertTimestampToISO(data.startDate),
      endDate: convertTimestampToISO(data.endDate),
      trialEndDate: convertTimestampToISO(data.trialEndDate),
      createdAt: convertTimestampToISO(data.createdAt),
    } as UserSubscription;
  });
};

// ============================================
// MATCH VIEW HELPERS
// ============================================

export const createMatchView = async (userId: string, matchViewData: Omit<MatchView, 'viewedAt'>): Promise<void> => {
  const matchView = {
    ...matchViewData,
    userId,
    viewedAt: serverTimestamp(),
  };
  const matchId = `${userId}_${matchViewData.buyerId}_${matchViewData.propertyId}`;
  await setDoc(doc(db, COLLECTIONS.MATCH_VIEWS, matchId), matchView);
};

export const getMatchView = async (userId: string, buyerId: string, propertyId: string): Promise<MatchView | null> => {
  const matchId = `${userId}_${buyerId}_${propertyId}`;
  const docSnap = await getDoc(doc(db, COLLECTIONS.MATCH_VIEWS, matchId));
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    ...data,
    viewedAt: convertTimestampToISO(data.viewedAt),
  } as MatchView;
};

export const getAllMatchViews = async (userId: string): Promise<MatchView[]> => {
  const q = query(
    collection(db, COLLECTIONS.MATCH_VIEWS),
    where('userId', '==', userId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      viewedAt: convertTimestampToISO(data.viewedAt),
    } as MatchView;
  });
};

export const getMatchViewsByBuyer = async (userId: string, buyerId: string): Promise<MatchView[]> => {
  const q = query(
    collection(db, COLLECTIONS.MATCH_VIEWS),
    where('userId', '==', userId),
    where('buyerId', '==', buyerId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      viewedAt: convertTimestampToISO(data.viewedAt),
    } as MatchView;
  });
};

export const getMatchViewsByProperty = async (userId: string, propertyId: string): Promise<MatchView[]> => {
  const q = query(
    collection(db, COLLECTIONS.MATCH_VIEWS),
    where('userId', '==', userId),
    where('propertyId', '==', propertyId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      viewedAt: convertTimestampToISO(data.viewedAt),
    } as MatchView;
  });
};

export const deleteMatchView = async (userId: string, buyerId: string, propertyId: string): Promise<void> => {
  const matchId = `${userId}_${buyerId}_${propertyId}`;
  await deleteDoc(doc(db, COLLECTIONS.MATCH_VIEWS, matchId));
};

// ============================================
// EXCLUDED MATCH HELPERS
// ============================================

export interface ExcludedMatch {
  userId: string;
  clientId: string;
  propertyId: string;
  excludedAt: string;
}

export const createExcludedMatch = async (userId: string, clientId: string, propertyId: string): Promise<void> => {
  const excludedMatch = {
    userId,
    clientId,
    propertyId,
    excludedAt: serverTimestamp(),
  };
  const matchId = `${userId}_${clientId}_${propertyId}`;
  await setDoc(doc(db, COLLECTIONS.EXCLUDED_MATCHES, matchId), excludedMatch);
};

export const getExcludedMatch = async (userId: string, clientId: string, propertyId: string): Promise<ExcludedMatch | null> => {
  const matchId = `${userId}_${clientId}_${propertyId}`;
  const docSnap = await getDoc(doc(db, COLLECTIONS.EXCLUDED_MATCHES, matchId));
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    ...data,
    excludedAt: convertTimestampToISO(data.excludedAt),
  } as ExcludedMatch;
};

export const getAllExcludedMatches = async (userId: string): Promise<ExcludedMatch[]> => {
  const q = query(
    collection(db, COLLECTIONS.EXCLUDED_MATCHES),
    where('userId', '==', userId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      excludedAt: convertTimestampToISO(data.excludedAt),
    } as ExcludedMatch;
  });
};

export const getExcludedMatchesByClient = async (userId: string, clientId: string): Promise<ExcludedMatch[]> => {
  const q = query(
    collection(db, COLLECTIONS.EXCLUDED_MATCHES),
    where('userId', '==', userId),
    where('clientId', '==', clientId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      excludedAt: convertTimestampToISO(data.excludedAt),
    } as ExcludedMatch;
  });
};

export const deleteExcludedMatch = async (userId: string, clientId: string, propertyId: string): Promise<void> => {
  const matchId = `${userId}_${clientId}_${propertyId}`;
  await deleteDoc(doc(db, COLLECTIONS.EXCLUDED_MATCHES, matchId));
};

// ============================================
// BATCH OPERATIONS
// ============================================

export const batchDeleteClients = async (clientIds: string[]): Promise<void> => {
  const batch = writeBatch(db);
  clientIds.forEach(id => {
    batch.delete(doc(db, COLLECTIONS.CLIENTS, id));
  });
  await batch.commit();
};

export const batchDeleteProperties = async (propertyIds: string[]): Promise<void> => {
  const batch = writeBatch(db);
  propertyIds.forEach(id => {
    batch.delete(doc(db, COLLECTIONS.PROPERTIES, id));
  });
  await batch.commit();
};

export const batchDeleteAppointments = async (appointmentIds: string[]): Promise<void> => {
  const batch = writeBatch(db);
  appointmentIds.forEach(id => {
    batch.delete(doc(db, COLLECTIONS.APPOINTMENTS, id));
  });
  await batch.commit();
};

export const batchUpdateClients = async (updates: { id: string; data: Partial<Client> }[]): Promise<void> => {
  const batch = writeBatch(db);
  updates.forEach(({ id, data }) => {
    batch.update(doc(db, COLLECTIONS.CLIENTS, id), data);
  });
  await batch.commit();
};

export const batchUpdateProperties = async (updates: { id: string; data: Partial<Property> }[]): Promise<void> => {
  const batch = writeBatch(db);
  updates.forEach(({ id, data }) => {
    batch.update(doc(db, COLLECTIONS.PROPERTIES, id), data);
  });
  await batch.commit();
};
