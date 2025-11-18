import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SubscriptionPlan, UserSubscription, SubscriptionStatus } from '@/types';

const STORAGE_KEYS = {
  PLANS: '@crm_subscription_plans',
  SUBSCRIPTIONS: '@crm_user_subscriptions',
};

const TRIAL_DURATION_DAYS = 7;

const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 19.99,
    duration: 30,
    features: [
      'Up to 50 clients',
      'Up to 100 properties',
      'Basic reporting',
      'Email support',
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    maxClients: 50,
    maxProperties: 100,
    hasMatchesFeature: false,
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: 49.99,
    duration: 30,
    features: [
      'Unlimited clients',
      'Unlimited properties',
      'Advanced reporting',
      'Priority support',
      'Custom branding',
      'API access',
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    maxClients: undefined,
    maxProperties: undefined,
    hasMatchesFeature: true,
  },
];

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_PLANS);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansData, subscriptionsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PLANS),
        AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS),
      ]);

      if (plansData) {
        setPlans(JSON.parse(plansData));
      } else {
        await AsyncStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(DEFAULT_PLANS));
      }

      if (subscriptionsData) {
        setSubscriptions(JSON.parse(subscriptionsData));
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePlans = async (newPlans: SubscriptionPlan[]) => {
    setPlans(newPlans);
    await AsyncStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(newPlans));
  };

  const saveSubscriptions = async (newSubscriptions: UserSubscription[]) => {
    setSubscriptions(newSubscriptions);
    await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(newSubscriptions));
  };

  const createTrialSubscription = useCallback(async (userId: string): Promise<UserSubscription> => {
    console.log('Creating trial subscription for user:', userId);
    const now = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

    const subscription: UserSubscription = {
      id: `sub-${Date.now()}`,
      userId,
      planId: null,
      status: 'trial',
      startDate: now.toISOString(),
      endDate: trialEnd.toISOString(),
      trialEndDate: trialEnd.toISOString(),
      autoRenew: false,
      createdAt: now.toISOString(),
    };

    const updated = [...subscriptions, subscription];
    await saveSubscriptions(updated);
    return subscription;
  }, [subscriptions]);

  const getUserSubscription = useCallback((userId: string): UserSubscription | undefined => {
    return subscriptions.find(s => s.userId === userId);
  }, [subscriptions]);

  const getSubscriptionStatus = useCallback((userId: string): {
    hasActiveSubscription: boolean;
    isOnTrial: boolean;
    isExpired: boolean;
    daysRemaining: number;
    subscription: UserSubscription | undefined;
  } => {
    const subscription = getUserSubscription(userId);

    if (!subscription) {
      return {
        hasActiveSubscription: false,
        isOnTrial: false,
        isExpired: false,
        daysRemaining: 0,
        subscription: undefined,
      };
    }

    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const isExpired = now > endDate;

    return {
      hasActiveSubscription: !isExpired && (subscription.status === 'trial' || subscription.status === 'active'),
      isOnTrial: subscription.status === 'trial' && !isExpired,
      isExpired,
      daysRemaining,
      subscription,
    };
  }, [getUserSubscription]);

  const subscribeToPlan = useCallback(async (
    userId: string,
    planId: string
  ): Promise<{ success: boolean; message: string }> => {
    console.log('Subscribing user to plan:', userId, planId);
    const plan = plans.find(p => p.id === planId);

    if (!plan || !plan.isActive) {
      return { success: false, message: 'Plan not found or inactive' };
    }

    const existingSubscription = getUserSubscription(userId);
    const now = new Date();
    const endDate = new Date(now.getTime() + plan.duration * 24 * 60 * 60 * 1000);

    if (existingSubscription) {
      const updated = subscriptions.map(s =>
        s.userId === userId
          ? {
              ...s,
              planId,
              status: 'active' as SubscriptionStatus,
              startDate: now.toISOString(),
              endDate: endDate.toISOString(),
              autoRenew: true,
            }
          : s
      );
      await saveSubscriptions(updated);
    } else {
      const newSubscription: UserSubscription = {
        id: `sub-${Date.now()}`,
        userId,
        planId,
        status: 'active',
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        trialEndDate: now.toISOString(),
        autoRenew: true,
        createdAt: now.toISOString(),
      };
      await saveSubscriptions([...subscriptions, newSubscription]);
    }

    return { success: true, message: `Successfully subscribed to ${plan.name}` };
  }, [plans, subscriptions, getUserSubscription]);

  const cancelSubscription = useCallback(async (userId: string): Promise<{ success: boolean; message: string }> => {
    console.log('Cancelling subscription for user:', userId);
    const subscription = getUserSubscription(userId);

    if (!subscription) {
      return { success: false, message: 'No subscription found' };
    }

    const updated = subscriptions.map(s =>
      s.userId === userId
        ? { ...s, status: 'cancelled' as SubscriptionStatus, autoRenew: false }
        : s
    );
    await saveSubscriptions(updated);
    return { success: true, message: 'Subscription cancelled successfully' };
  }, [subscriptions, getUserSubscription]);

  const addPlan = useCallback(async (plan: Omit<SubscriptionPlan, 'id' | 'createdAt'>): Promise<void> => {
    console.log('Adding new plan:', plan.name);
    const newPlan: SubscriptionPlan = {
      ...plan,
      id: `plan-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    await savePlans([...plans, newPlan]);
  }, [plans]);

  const updatePlan = useCallback(async (planId: string, updates: Partial<SubscriptionPlan>): Promise<void> => {
    console.log('Updating plan:', planId);
    const updated = plans.map(p => p.id === planId ? { ...p, ...updates } : p);
    await savePlans(updated);
  }, [plans]);

  const deletePlan = useCallback(async (planId: string): Promise<void> => {
    console.log('Deleting plan:', planId);
    const updated = plans.filter(p => p.id !== planId);
    await savePlans(updated);
  }, [plans]);

  const getActivePlans = useCallback(() => {
    return plans.filter(p => p.isActive);
  }, [plans]);

  const getAllPlans = useCallback(() => {
    return plans;
  }, [plans]);

  const getPlanLimits = useCallback((userId: string) => {
    const subscription = getUserSubscription(userId);
    if (!subscription || !subscription.planId) {
      return {
        maxClients: undefined,
        maxProperties: undefined,
        hasMatchesFeature: false,
      };
    }

    const plan = plans.find(p => p.id === subscription.planId);
    if (!plan) {
      return {
        maxClients: undefined,
        maxProperties: undefined,
        hasMatchesFeature: false,
      };
    }

    return {
      maxClients: plan.maxClients,
      maxProperties: plan.maxProperties,
      hasMatchesFeature: plan.hasMatchesFeature,
    };
  }, [plans, getUserSubscription]);

  return useMemo(() => ({
    plans,
    subscriptions,
    isLoading,
    createTrialSubscription,
    getUserSubscription,
    getSubscriptionStatus,
    subscribeToPlan,
    cancelSubscription,
    addPlan,
    updatePlan,
    deletePlan,
    getActivePlans,
    getAllPlans,
    getPlanLimits,
  }), [
    plans,
    subscriptions,
    isLoading,
    createTrialSubscription,
    getUserSubscription,
    getSubscriptionStatus,
    subscribeToPlan,
    cancelSubscription,
    addPlan,
    updatePlan,
    deletePlan,
    getActivePlans,
    getAllPlans,
    getPlanLimits,
  ]);
});
