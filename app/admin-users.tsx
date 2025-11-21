import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import Colors from '@/constants/colors';
import { router, Stack } from 'expo-router';
import { UserCheck, UserX, Clock, Mail, Calendar, Shield, CreditCard } from 'lucide-react-native';
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import type { User } from '@/types';

export default function AdminUsersScreen() {
  const { getAllUsers, updateUserStatus, isAdmin } = useAuth();
  const { subscribeToPlan, getAllPlans } = useSubscription();
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [users, setUsers] = React.useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(true);

  const plans = getAllPlans();

  React.useEffect(() => {
    const loadUsers = async () => {
      setIsLoadingUsers(true);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      setIsLoadingUsers(false);
    };
    loadUsers();
  }, [getAllUsers, refreshKey]);

  if (!isAdmin) {
    router.back();
    return null;
  }

  const handleApprove = (user: User) => {
    const selectedPlan = plans.find(p => p.id === user.selectedPlanId);
    const planInfo = selectedPlan ? `\n\nSelected Plan: ${selectedPlan.name} (${selectedPlan.price.toFixed(2)})` : '';

    Alert.alert(
      'Approve User',
      `Approve ${user.name} (${user.email})?${planInfo}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            console.log('Approving user:', user.id);
            await updateUserStatus(user.id, 'approved');

            if (user.selectedPlanId) {
              console.log('Subscribing user to plan:', user.selectedPlanId);
              const result = await subscribeToPlan(user.id, user.selectedPlanId);
              console.log('Subscription result:', result);
            }

            setRefreshKey(prev => prev + 1);
            console.log('User approved successfully');
            Alert.alert('Success', `${user.name} has been approved and subscribed to their selected plan`);
          },
        },
      ]
    );
  };

  const handleReject = (user: User) => {
    Alert.alert(
      'Reject User',
      `Reject ${user.name} (${user.email})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            console.log('Rejecting user:', user.id);
            await updateUserStatus(user.id, 'rejected');
            setRefreshKey(prev => prev + 1);
            console.log('User rejected successfully');
            Alert.alert('Success', `${user.name} has been rejected`);
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
      default:
        return Colors.textLight;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <UserCheck size={20} color="#10B981" />;
      case 'rejected':
        return <UserX size={20} color="#EF4444" />;
      case 'pending':
        return <Clock size={20} color="#F59E0B" />;
      default:
        return null;
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{item.name}</Text>
            {item.role === 'admin' && (
              <View style={styles.adminBadge}>
                <Shield size={12} color="#fff" />
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>
          <View style={styles.userDetail}>
            <Mail size={14} color={Colors.textLight} />
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
          <View style={styles.userDetail}>
            <Calendar size={14} color={Colors.textLight} />
            <Text style={styles.userDate}>
              Joined {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          {item.selectedPlanId && (
            <View style={styles.userDetail}>
              <CreditCard size={14} color={Colors.primary} />
              <Text style={styles.planText}>
                {plans.find(p => p.id === item.selectedPlanId)?.name || 'Unknown Plan'}
              </Text>
            </View>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          {getStatusIcon(item.status)}
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      {item.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(item)}
          >
            <UserCheck size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item)}
          >
            <UserX size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'approved' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item)}
          >
            <UserX size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Revoke Access</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'rejected' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(item)}
          >
            <UserCheck size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const pendingUsers = users.filter(u => u.status === 'pending');
  const approvedUsers = users.filter(u => u.status === 'approved');
  const rejectedUsers = users.filter(u => u.status === 'rejected');

  return (
    <>
      <Stack.Screen options={{ title: 'User Management', headerShown: true }} />
      <View style={styles.container}>
        <View style={styles.stats}>
          <View style={[styles.statCard, { backgroundColor: '#F59E0B20' }]}>
            <Clock size={24} color="#F59E0B" />
            <Text style={styles.statNumber}>{pendingUsers.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#10B98120' }]}>
            <UserCheck size={24} color="#10B981" />
            <Text style={styles.statNumber}>{approvedUsers.length}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#EF444420' }]}>
            <UserX size={24} color="#EF4444" />
            <Text style={styles.statNumber}>{rejectedUsers.length}</Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </View>
        </View>

        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          extraData={refreshKey}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Shield size={48} color={Colors.textLight} />
              <Text style={styles.emptyText}>No users registered yet</Text>
            </View>
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  stats: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '600' as const,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  userCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#fff',
  },
  userDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textLight,
  },
  userDate: {
    fontSize: 12,
    color: Colors.textLight,
  },
  planText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
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
