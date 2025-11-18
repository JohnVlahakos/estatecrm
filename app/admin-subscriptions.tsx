import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import Colors from '@/constants/colors';
import { router, Stack } from 'expo-router';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  XCircle 
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Switch,
} from 'react-native';
import type { SubscriptionPlan } from '@/types';

export default function AdminSubscriptionsScreen() {
  const { isAdmin } = useAuth();
  const { getAllPlans, addPlan, updatePlan, deletePlan } = useSubscription();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration: '',
    features: '',
    isActive: true,
    maxClients: '',
    maxProperties: '',
    hasMatchesFeature: false,
  });

  if (!isAdmin) {
    router.back();
    return null;
  }

  const plans = getAllPlans();

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      duration: '',
      features: '',
      isActive: true,
      maxClients: '',
      maxProperties: '',
      hasMatchesFeature: false,
    });
    setEditingPlan(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price.toString(),
      duration: plan.duration.toString(),
      features: plan.features.join('\n'),
      isActive: plan.isActive,
      maxClients: plan.maxClients?.toString() || '',
      maxProperties: plan.maxProperties?.toString() || '',
      hasMatchesFeature: plan.hasMatchesFeature,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.duration) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const price = parseFloat(formData.price);
    const duration = parseInt(formData.duration);

    if (isNaN(price) || isNaN(duration)) {
      Alert.alert('Error', 'Please enter valid numbers for price and duration');
      return;
    }

    const features = formData.features
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    const maxClients = formData.maxClients ? parseInt(formData.maxClients) : undefined;
    const maxProperties = formData.maxProperties ? parseInt(formData.maxProperties) : undefined;

    if (formData.maxClients && isNaN(maxClients as number)) {
      Alert.alert('Error', 'Please enter a valid number for max clients');
      return;
    }

    if (formData.maxProperties && isNaN(maxProperties as number)) {
      Alert.alert('Error', 'Please enter a valid number for max properties');
      return;
    }

    try {
      if (editingPlan) {
        await updatePlan(editingPlan.id, {
          name: formData.name,
          price,
          duration,
          features,
          isActive: formData.isActive,
          maxClients,
          maxProperties,
          hasMatchesFeature: formData.hasMatchesFeature,
        });
        Alert.alert('Success', 'Plan updated successfully');
      } else {
        await addPlan({
          name: formData.name,
          price,
          duration,
          features,
          isActive: formData.isActive,
          maxClients,
          maxProperties,
          hasMatchesFeature: formData.hasMatchesFeature,
        });
        Alert.alert('Success', 'Plan created successfully');
      }
      setModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to save plan');
      console.error('Error saving plan:', error);
    }
  };

  const handleDelete = (plan: SubscriptionPlan) => {
    Alert.alert(
      'Delete Plan',
      `Are you sure you want to delete "${plan.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlan(plan.id);
              Alert.alert('Success', 'Plan deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete plan');
              console.error('Error deleting plan:', error);
            }
          },
        },
      ]
    );
  };

  const renderPlan = ({ item }: { item: SubscriptionPlan }) => (
    <View style={styles.planCard}>
      <View style={styles.planHeader}>
        <View style={styles.planTitleRow}>
          <Text style={styles.planName}>{item.name}</Text>
          {item.isActive ? (
            <View style={styles.activeBadge}>
              <CheckCircle size={14} color="#10B981" />
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          ) : (
            <View style={styles.inactiveBadge}>
              <XCircle size={14} color="#EF4444" />
              <Text style={styles.inactiveBadgeText}>Inactive</Text>
            </View>
          )}
        </View>

        <View style={styles.planDetails}>
          <View style={styles.planDetail}>
            <DollarSign size={16} color={Colors.primary} />
            <Text style={styles.planPrice}>${item.price.toFixed(2)}</Text>
          </View>
          <View style={styles.planDetail}>
            <Calendar size={16} color={Colors.textLight} />
            <Text style={styles.planDuration}>{item.duration} days</Text>
          </View>
        </View>
      </View>

      <View style={styles.featuresSection}>
        <Text style={styles.featuresTitle}>Limits:</Text>
        <View style={styles.limitsContainer}>
          <View style={styles.limitItem}>
            <Text style={styles.limitLabel}>Max Clients:</Text>
            <Text style={styles.limitValue}>
              {item.maxClients ? item.maxClients.toString() : 'Unlimited'}
            </Text>
          </View>
          <View style={styles.limitItem}>
            <Text style={styles.limitLabel}>Max Properties:</Text>
            <Text style={styles.limitValue}>
              {item.maxProperties ? item.maxProperties.toString() : 'Unlimited'}
            </Text>
          </View>
          <View style={styles.limitItem}>
            <Text style={styles.limitLabel}>Matches Feature:</Text>
            <Text style={[styles.limitValue, item.hasMatchesFeature ? styles.limitEnabled : styles.limitDisabled]}>
              {item.hasMatchesFeature ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.featuresSection}>
        <Text style={styles.featuresTitle}>Features:</Text>
        {item.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <View style={styles.planActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(item)}
        >
          <Edit2 size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item)}
        >
          <Trash2 size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Subscription Plans', 
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={openAddModal} style={styles.headerButton}>
              <Plus size={24} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      <View style={styles.container}>
        <FlatList
          data={plans}
          renderItem={renderPlan}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <DollarSign size={48} color={Colors.textLight} />
              <Text style={styles.emptyText}>No subscription plans yet</Text>
              <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                <Plus size={20} color="#fff" />
                <Text style={styles.addButtonText}>Create First Plan</Text>
              </TouchableOpacity>
            </View>
          }
        />

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView style={styles.modalScroll}>
                <Text style={styles.modalTitle}>
                  {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                </Text>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Plan Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholder="e.g., Premium Plan"
                    placeholderTextColor={Colors.textLight}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Price (USD) *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.price}
                    onChangeText={(text) => setFormData({ ...formData, price: text })}
                    placeholder="e.g., 49.99"
                    keyboardType="decimal-pad"
                    placeholderTextColor={Colors.textLight}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Duration (days) *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.duration}
                    onChangeText={(text) => setFormData({ ...formData, duration: text })}
                    placeholder="e.g., 30"
                    keyboardType="number-pad"
                    placeholderTextColor={Colors.textLight}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Features (one per line) *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.features}
                    onChangeText={(text) => setFormData({ ...formData, features: text })}
                    placeholder="e.g., Unlimited clients&#10;Advanced reports&#10;Priority support"
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    placeholderTextColor={Colors.textLight}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Max Clients (Leave empty for unlimited)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.maxClients}
                    onChangeText={(text) => setFormData({ ...formData, maxClients: text })}
                    placeholder="e.g., 50 or leave empty"
                    keyboardType="number-pad"
                    placeholderTextColor={Colors.textLight}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Max Properties (Leave empty for unlimited)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.maxProperties}
                    onChangeText={(text) => setFormData({ ...formData, maxProperties: text })}
                    placeholder="e.g., 100 or leave empty"
                    keyboardType="number-pad"
                    placeholderTextColor={Colors.textLight}
                  />
                </View>

                <View style={styles.switchGroup}>
                  <Text style={styles.label}>Enable Matches Feature</Text>
                  <Switch
                    value={formData.hasMatchesFeature}
                    onValueChange={(value) => setFormData({ ...formData, hasMatchesFeature: value })}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor="#fff"
                  />
                </View>

                <View style={styles.switchGroup}>
                  <Text style={styles.label}>Active Plan</Text>
                  <Switch
                    value={formData.isActive}
                    onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor="#fff"
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setModalVisible(false);
                      resetForm();
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleSave}
                  >
                    <Text style={styles.saveButtonText}>
                      {editingPlan ? 'Update' : 'Create'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerButton: {
    paddingHorizontal: 16,
  },
  list: {
    padding: 16,
    gap: 16,
  },
  planCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  planHeader: {
    marginBottom: 16,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  planName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98120',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  inactiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF444420',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  inactiveBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  planDetails: {
    flexDirection: 'row',
    gap: 20,
  },
  planDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  planDuration: {
    fontSize: 14,
    color: Colors.textLight,
  },
  featuresSection: {
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textLight,
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 8,
  },
  featureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
  },
  planActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  editButton: {
    backgroundColor: Colors.primary,
  },
  deleteButton: {
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
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textLight,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalScroll: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  limitsContainer: {
    gap: 8,
    marginBottom: 8,
  },
  limitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  limitLabel: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '500' as const,
  },
  limitValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  limitEnabled: {
    color: '#10B981',
  },
  limitDisabled: {
    color: '#EF4444',
  },
});
