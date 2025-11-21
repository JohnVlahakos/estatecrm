import { useCRM } from '@/contexts/CRMContext';
import Colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { TrendingUp, Users, Building2, Calendar, Plus } from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function DashboardScreen() {
  const { clients, properties, appointments, isLoading } = useCRM();
  const router = useRouter();

  const stats = useMemo(() => {
    const activeClients = clients.filter(c => c.status === 'active').length;
    const leads = clients.filter(c => c.status === 'lead').length;
    const activeProperties = properties.filter(p => p.status === 'active').length;
    const todayAppointments = appointments.filter(a => {
      const today = new Date().toISOString().split('T')[0];
      return a.date === today && !a.completed;
    }).length;

    return {
      activeClients,
      leads,
      activeProperties,
      todayAppointments,
      totalClients: clients.length,
      totalProperties: properties.length,
    };
  }, [clients, properties, appointments]);

  const recentActivities = useMemo(() => {
    const activities = [
      ...clients.slice(0, 3).map(c => ({
        id: `client-${c.id}`,
        type: 'client' as const,
        title: `New client: ${c.name}`,
        date: c.createdAt,
      })),
      ...properties.slice(0, 3).map(p => ({
        id: `property-${p.id}`,
        type: 'property' as const,
        title: `New property: ${p.title}`,
        date: p.createdAt,
      })),
    ];

    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [clients, properties]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.titleText}>Estate Laconia CRM</Text>
      </View>

      <View style={styles.statsGrid}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statCardLarge}
        >
          <TrendingUp size={32} color="#fff" />
          <Text style={styles.statLargeValue}>{stats.activeClients}</Text>
          <Text style={styles.statLargeLabel}>Active Clients</Text>
        </LinearGradient>

        <View style={styles.statCardSmall}>
          <Users size={24} color={Colors.statusLead} />
          <Text style={styles.statSmallValue}>{stats.leads}</Text>
          <Text style={styles.statSmallLabel}>Leads</Text>
        </View>

        <View style={styles.statCardSmall}>
          <Building2 size={24} color={Colors.success} />
          <Text style={styles.statSmallValue}>{stats.activeProperties}</Text>
          <Text style={styles.statSmallLabel}>Properties</Text>
        </View>

        <View style={styles.statCardSmall}>
          <Calendar size={24} color={Colors.warning} />
          <Text style={styles.statSmallValue}>{stats.todayAppointments}</Text>
          <Text style={styles.statSmallLabel}>Today</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>
        {recentActivities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No recent activity</Text>
            <Text style={styles.emptyStateSubtext}>Start by adding clients and properties</Text>
          </View>
        ) : (
          recentActivities.map((activity) => (
            <View
              key={activity.id}
              style={styles.activityCard}
            >
              <View style={styles.activityIcon}>
                {activity.type === 'client' ? (
                  <Users size={20} color={Colors.primary} />
                ) : (
                  <Building2 size={20} color={Colors.success} />
                )}
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDate}>
                  {new Date(activity.date).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/clients')}
          >
            <Plus size={24} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Add Client</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/properties')}
          >
            <Plus size={24} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Add Property</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCardLarge: {
    flex: 1,
    minWidth: '100%',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statLargeValue: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: '#fff',
    marginTop: 12,
  },
  statLargeLabel: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  statCardSmall: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statSmallValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 8,
  },
  statSmallLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textLight,
  },
  quickActions: {
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginTop: 8,
  },
});
