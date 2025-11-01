import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import Colors from '@/constants/colors';
import { router, Stack } from 'expo-router';
import { 
  Crown, 
  Check, 
  Calendar, 
  DollarSign,
  Clock,
  AlertCircle,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import type { SubscriptionPlan } from '@/types';

export default function SubscriptionScreen() {
  const { currentUser } = useAuth();
  const { getActivePlans, getSubscriptionStatus, subscribeToPlan } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const plans = getActivePlans();
  const subscriptionStatus = currentUser ? getSubscriptionStatus(currentUser.id) : null;

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
    }
  }, [currentUser]);

  if (!currentUser) {
    return null;
  }

  const handleSubscribe = async (planId: string) => {
    if (isSubscribing) return;

    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    Alert.alert(
      'Confirm Subscription',
      `Subscribe to ${plan.name} for $${plan.price.toFixed(2)} per ${plan.duration} days?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: async () => {
            setIsSubscribing(true);
            try {
              const result = await subscribeToPlan(currentUser.id, planId);
              if (result.success) {
                Alert.alert('Success', result.message, [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ]);
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to subscribe. Please try again.');
              console.error('Subscription error:', error);
            } finally {
              setIsSubscribing(false);
            }
          },
        },
      ]
    );
  };

  const renderStatusCard = () => {
    if (!subscriptionStatus) return null;

    const { hasActiveSubscription, isOnTrial, daysRemaining, subscription } = subscriptionStatus;

    if (!hasActiveSubscription && !isOnTrial) {
      return (
        <View style={[styles.statusCard, styles.expiredCard]}>
          <AlertCircle size={32} color="#EF4444" />
          <Text style={styles.statusTitle}>No Active Subscription</Text>
          <Text style={styles.statusDescription}>
            Choose a plan below to continue using the CRM
          </Text>
        </View>
      );
    }

    if (isOnTrial) {
      return (
        <View style={[styles.statusCard, styles.trialCard]}>
          <Clock size={32} color="#F59E0B" />
          <Text style={styles.statusTitle}>Free Trial Active</Text>
          <Text style={styles.statusDescription}>
            {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
          </Text>
          <Text style={styles.statusSubtext}>
            Subscribe to a plan to continue after trial ends
          </Text>
        </View>
      );
    }

    const currentPlan = plans.find(p => p.id === subscription?.planId);
    
    return (
      <View style={[styles.statusCard, styles.activeCard]}>
        <Crown size={32} color="#10B981" />
        <Text style={styles.statusTitle}>Active Subscription</Text>
        {currentPlan && (
          <Text style={styles.statusPlanName}>{currentPlan.name}</Text>
        )}
        <Text style={styles.statusDescription}>
          {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
        </Text>
      </View>
    );
  };

  const renderPlan = (plan: SubscriptionPlan) => {
    const isCurrentPlan = subscriptionStatus?.subscription?.planId === plan.id;
    const isSelected = selectedPlan === plan.id;

    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
          isCurrentPlan && styles.planCardCurrent,
        ]}
        onPress={() => setSelectedPlan(plan.id)}
        activeOpacity={0.7}
      >
        {isCurrentPlan && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>Current Plan</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <Text style={styles.planName}>{plan.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.planPrice}>${plan.price.toFixed(2)}</Text>
            <Text style={styles.planPeriod}>/ {plan.duration} days</Text>
          </View>
        </View>

        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Check size={18} color={Colors.primary} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {!isCurrentPlan && (
          <TouchableOpacity
            style={[
              styles.subscribeButton,
              isSelected && styles.subscribeButtonSelected,
            ]}
            onPress={() => handleSubscribe(plan.id)}
            disabled={isSubscribing}
          >
            <Text style={styles.subscribeButtonText}>
              {isSubscribing ? 'Processing...' : 'Subscribe Now'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Subscription Plans', headerShown: true }} />
      <ScrollView style={styles.container}>
        {renderStatusCard()}

        <View style={styles.plansSection}>
          <View style={styles.sectionHeader}>
            <Crown size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Available Plans</Text>
          </View>
          
          {plans.length === 0 ? (
            <View style={styles.emptyState}>
              <DollarSign size={48} color={Colors.textLight} />
              <Text style={styles.emptyText}>No plans available at the moment</Text>
            </View>
          ) : (
            <View style={styles.plansGrid}>
              {plans.map(renderPlan)}
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Calendar size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              All plans include a 7-day free trial for new users
            </Text>
          </View>
          <View style={styles.infoCard}>
            <AlertCircle size={20} color={Colors.textLight} />
            <Text style={styles.infoText}>
              Cancel anytime. No hidden fees or commitments
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  statusCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  trialCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  activeCard: {
    backgroundColor: '#D1FAE5',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  expiredCard: {
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 8,
  },
  statusPlanName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  statusDescription: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  statusSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 4,
  },
  plansSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  plansGrid: {
    gap: 16,
  },
  planCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  planCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  planCardCurrent: {
    borderColor: '#10B981',
    backgroundColor: '#10B98110',
  },
  currentBadge: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  planHeader: {
    marginBottom: 20,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  planPeriod: {
    fontSize: 14,
    color: Colors.textLight,
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscribeButtonSelected: {
    backgroundColor: Colors.primary,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  infoSection: {
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textLight,
  },
});
