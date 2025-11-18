import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import Colors from '@/constants/colors';
import { Save, LogOut, Shield, Users, Bell, Crown, DollarSign, MapPin, Edit2, X, Camera } from 'lucide-react-native';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const { googleMapsApiKey, saveGoogleMapsApiKey, isLoading } = useSettings();
  const { currentUser, logout, isAdmin, getPendingUsers, updateUserProfile } = useAuth();
  const { getSubscriptionStatus } = useSubscription();
  const [apiKey, setApiKey] = useState(googleMapsApiKey);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editEmail, setEditEmail] = useState(currentUser?.email || '');
  const [editPassword, setEditPassword] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const pendingCount = getPendingUsers().length;
  const subscriptionStatus = currentUser ? getSubscriptionStatus(currentUser.id) : null;

  React.useEffect(() => {
    setApiKey(googleMapsApiKey);
  }, [googleMapsApiKey]);

  React.useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name);
      setEditEmail(currentUser.email);
      setEditAvatarUrl(currentUser.avatarUrl || '');
    }
  }, [currentUser]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveGoogleMapsApiKey(apiKey);
      Alert.alert('Success', 'Google Maps API Key saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save API key. Please try again.');
      console.error('Error saving API key:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditName(currentUser?.name || '');
    setEditEmail(currentUser?.email || '');
    setEditPassword('');
    setEditAvatarUrl(currentUser?.avatarUrl || '');
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library permission to select an avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      setEditAvatarUrl(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    if (!editEmail.trim()) {
      Alert.alert('Error', 'Email cannot be empty');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const updates: { name?: string; email?: string; password?: string; avatarUrl?: string } = {
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        avatarUrl: editAvatarUrl,
      };

      if (editPassword.trim()) {
        updates.password = editPassword;
      }

      await updateUserProfile(currentUser.id, updates);
      setIsEditingProfile(false);
      setEditPassword('');
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
      console.error('Error updating profile:', error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            console.log('Logout button pressed');
            await logout();
            console.log('Logout completed, navigating to login');
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleManageUsers = () => {
    router.push('/admin-users');
  };

  const handleManageSubscriptions = () => {
    router.push('/admin-subscriptions');
  };

  const handleManageCities = () => {
    router.push('/admin-cities');
  };

  const handleViewSubscription = () => {
    router.push('/subscription');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.userSection}>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <TouchableOpacity 
              style={styles.userAvatar} 
              onPress={isEditingProfile ? handlePickImage : undefined}
              disabled={!isEditingProfile}
            >
              {currentUser?.avatarUrl ? (
                <Image 
                  source={{ uri: currentUser.avatarUrl }} 
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.userAvatarText}>
                  {currentUser?.name.charAt(0).toUpperCase()}
                </Text>
              )}
              {isEditingProfile && (
                <View style={styles.cameraOverlay}>
                  <Camera size={20} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{currentUser?.name}</Text>
              <Text style={styles.userEmailDisplay}>{currentUser?.email}</Text>
              {isAdmin && (
                <View style={styles.adminBadge}>
                  <Shield size={12} color="#fff" />
                  <Text style={styles.adminBadgeText}>Administrator</Text>
                </View>
              )}
            </View>
          </View>
          {!isEditingProfile && (
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Edit2 size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {isEditingProfile && (
          <View style={styles.editSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.profileInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor={Colors.textLight}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.profileInput}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Enter your email"
                placeholderTextColor={Colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password (leave empty to keep current)</Text>
              <TextInput
                style={styles.profileInput}
                value={editPassword}
                onChangeText={setEditPassword}
                placeholder="Enter new password"
                placeholderTextColor={Colors.textLight}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.editActionButton, styles.cancelButton]}
                onPress={handleCancelEdit}
                disabled={isUpdatingProfile}
              >
                <X size={18} color="#EF4444" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editActionButton, styles.saveProfileButton]}
                onPress={handleSaveProfile}
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Save size={18} color="#fff" />
                    <Text style={styles.saveProfileButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <TouchableOpacity style={styles.subscriptionCard} onPress={handleViewSubscription}>
          <View style={styles.subscriptionLeft}>
            <Crown size={24} color={subscriptionStatus?.hasActiveSubscription ? '#10B981' : '#F59E0B'} />
            <View>
              <Text style={styles.subscriptionTitle}>
                {subscriptionStatus?.isOnTrial ? 'Free Trial' : 
                 subscriptionStatus?.hasActiveSubscription ? 'Active Subscription' :
                 'No Active Subscription'}
              </Text>
              <Text style={styles.subscriptionSubtitle}>
                {subscriptionStatus?.isOnTrial 
                  ? `${subscriptionStatus.daysRemaining} days remaining`
                  : subscriptionStatus?.hasActiveSubscription
                  ? `${subscriptionStatus.daysRemaining} days remaining`
                  : 'Tap to view plans'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Panel</Text>
          <TouchableOpacity style={styles.adminButton} onPress={handleManageUsers}>
            <View style={styles.adminButtonLeft}>
              <Users size={20} color={Colors.primary} />
              <Text style={styles.adminButtonText}>Manage Users</Text>
            </View>
            {pendingCount > 0 && (
              <View style={styles.badge}>
                <Bell size={12} color="#fff" />
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.adminButton} onPress={handleManageSubscriptions}>
            <View style={styles.adminButtonLeft}>
              <DollarSign size={20} color={Colors.primary} />
              <Text style={styles.adminButtonText}>Manage Subscription Plans</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.adminButton} onPress={handleManageCities}>
            <View style={styles.adminButtonLeft}>
              <MapPin size={20} color={Colors.primary} />
              <Text style={styles.adminButtonText}>Manage Cities & Regions</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Google Maps Integration</Text>
        <Text style={styles.description}>
          Enter your Google Maps API key to enable map features for property addresses.
        </Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>API Key</Text>
          <TextInput
            style={styles.input}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="Enter your Google Maps API key"
            placeholderTextColor={Colors.textLight}
            autoCapitalize="none"
            autoCorrect={false}
            testID="google-maps-api-key-input"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          testID="save-api-key-button"
        >
          {isSaving ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Save size={20} color={Colors.white} />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>How to get your API key:</Text>
          <Text style={styles.infoText}>
            1. Go to Google Cloud Console{'\n'}
            2. Create a new project or select existing{'\n'}
            3. Enable Maps JavaScript API{'\n'}
            4. Go to Credentials and create an API key{'\n'}
            5. Copy and paste the key above
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
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
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  inputContainer: {
    gap: 8,
    marginTop: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  infoBox: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  userSection: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary + '20',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
  },
  userDetails: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  userEmailDisplay: {
    fontSize: 14,
    color: Colors.textLight,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#fff',
  },
  adminButton: {
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adminButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  badge: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  subscriptionCard: {
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subscriptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  subscriptionSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
  },
  editSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  profileInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  cancelButton: {
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  saveProfileButton: {
    backgroundColor: Colors.primary,
  },
  saveProfileButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
