export type ClientStatus = 'lead' | 'active' | 'closed';
export type ClientCategory = 'buyer' | 'seller';
export type PropertyType = 'apartment' | 'house' | 'plot' | 'commercial';
export type PropertyStatus = 'active' | 'rented' | 'sold';
export type AppointmentType = 'viewing' | 'meeting' | 'call';

export interface ClientPreferences {
  securityDoor: boolean;
  elevator: boolean;
  alarm: boolean;
  view: boolean;
  veranda: boolean;
  bbq: boolean;
  fireplace: boolean;
  frontFacing: boolean;
  furnished: boolean;
  heated: boolean;
  internalStaircase: boolean;
  tents: boolean;
  satelliteAntenna: boolean;
  screens: boolean;
  pool: boolean;
  neoclassical: boolean;
  evCharging: boolean;
  reception: boolean;
  armchairs: boolean;
  investment: boolean;
  petsAllowed: boolean;
  listed: boolean;
  garden: boolean;
  underConstruction: boolean;
  parking: boolean;
  guesthouse: boolean;
  basement: boolean;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  budget: number;
  preferenceText?: string;
  preferences?: ClientPreferences;
  status: ClientStatus;
  category: ClientCategory;
  notes: string;
  createdAt: string;
  lastContact?: string;
  desiredPropertyType?: PropertyType;
  desiredLocation?: string;
  desiredLocations?: string[];
  minSize?: number;
  maxSize?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  budgetMin?: number;
  budgetMax?: number;
}

export interface PropertyFeatures {
  securityDoor: boolean;
  elevator: boolean;
  alarm: boolean;
  view: boolean;
  veranda: boolean;
  bbq: boolean;
  fireplace: boolean;
  frontFacing: boolean;
  furnished: boolean;
  heated: boolean;
  internalStaircase: boolean;
  tents: boolean;
  satelliteAntenna: boolean;
  screens: boolean;
  pool: boolean;
  neoclassical: boolean;
  evCharging: boolean;
  reception: boolean;
  armchairs: boolean;
  investment: boolean;
  petsAllowed: boolean;
  listed: boolean;
  garden: boolean;
  underConstruction: boolean;
  parking: boolean;
  guesthouse: boolean;
  basement: boolean;
}

export interface Property {
  id: string;
  title: string;
  type: PropertyType;
  location: string;
  size: number;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  description: string;
  photos: string[];
  status: PropertyStatus;
  ownerId?: string;
  createdAt: string;
  floors?: number;
  kitchens?: number;
  wc?: number;
  livingRooms?: number;
  storage?: boolean;
  attic?: boolean;
  playroom?: boolean;
  features?: PropertyFeatures;
  rentalInfo?: {
    rentedDate?: string;
    availableAfterMonths?: number;
    availableAfterYears?: number;
    availabilityDate?: string;
    notificationScheduled?: boolean;
    notificationId?: string;
  };
}

export interface Appointment {
  id: string;
  title: string;
  type: AppointmentType;
  clientId: string;
  propertyId?: string;
  date: string;
  time: string;
  notes: string;
  completed: boolean;
  createdAt: string;
  notificationId?: string;
  notificationScheduled?: boolean;
}

export interface CommunicationLog {
  id: string;
  clientId: string;
  type: 'call' | 'email' | 'meeting';
  notes: string;
  date: string;
}

export type UserRole = 'user' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  avatarUrl?: string;
  selectedPlanId?: string;
}

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
  maxClients?: number;
  maxProperties?: number;
  hasMatchesFeature: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string | null;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  trialEndDate: string;
  autoRenew: boolean;
  createdAt: string;
}

export interface MatchView {
  propertyId: string;
  buyerId: string;
  viewedAt: string;
}
