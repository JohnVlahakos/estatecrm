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
} from 'react-native';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { MapPin, Plus, Trash2, Edit2, X, Check } from 'lucide-react-native';



export default function AdminCitiesScreen() {
  const { cities, addCity, removeCity, updateCity, isLoading, googleMapsApiKey, saveGoogleMapsApiKey } = useSettings();
  const { isAdmin } = useAuth();
  const [newCityName, setNewCityName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingCity, setEditingCity] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');


  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyStateText}>Access Denied</Text>
        </View>
      </View>
    );
  }

  const handleAddCity = async () => {
    if (!newCityName.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ εισάγετε το όνομα της πόλης');
      return;
    }

    setIsAdding(true);
    try {
      await addCity(newCityName);
      setNewCityName('');
      Alert.alert('Επιτυχία', 'Η πόλη προστέθηκε επιτυχώς');
    } catch (error) {
      Alert.alert('Σφάλμα', error instanceof Error ? error.message : 'Αποτυχία προσθήκης πόλης');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveCity = (city: string) => {
    console.log('handleRemoveCity called for:', city);
    Alert.alert(
      'Επιβεβαίωση Διαγραφής',
      `Είστε σίγουροι ότι θέλετε να διαγράψετε την πόλη "${city}";`,
      [
        { text: 'Ακύρωση', style: 'cancel' },
        {
          text: 'Διαγραφή',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeCity(city);
              Alert.alert('Επιτυχία', 'Η πόλη διαγράφηκε επιτυχώς');
            } catch (error) {
              Alert.alert('Σφάλμα', 'Αποτυχία διαγραφής πόλης');
            }
          },
        },
      ]
    );
  };

  const handleStartEdit = (city: string) => {
    console.log('handleStartEdit called for:', city);
    setEditingCity(city);
    setEditingValue(city);
  };

  const handleCancelEdit = () => {
    setEditingCity(null);
    setEditingValue('');
  };

  const handleSaveEdit = async () => {
    if (!editingCity || !editingValue.trim()) return;

    try {
      await updateCity(editingCity, editingValue);
      setEditingCity(null);
      setEditingValue('');
      Alert.alert('Επιτυχία', 'Η πόλη ενημερώθηκε επιτυχώς');
    } catch (error) {
      Alert.alert('Σφάλμα', error instanceof Error ? error.message : 'Αποτυχία ενημέρωσης πόλης');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MapPin size={24} color={Colors.primary} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Πόλεις & Περιοχές</Text>
            <Text style={styles.headerSubtitle}>
              {cities.length} {cities.length === 1 ? 'πόλη' : 'πόλεις'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.addSection}>
        <View style={styles.addInputContainer}>
          <TextInput
            style={styles.addInput}
            placeholder="Προσθήκη νέας πόλης..."
            placeholderTextColor={Colors.textLight}
            value={newCityName}
            onChangeText={setNewCityName}
            editable={!isAdding}
          />
          <TouchableOpacity
            style={[styles.addButton, isAdding && styles.addButtonDisabled]}
            onPress={handleAddCity}
            disabled={isAdding}
          >
            {isAdding ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Plus size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.citiesList} contentContainerStyle={styles.citiesListContent}>
        {cities.map((city, index) => (
          <View key={`${city}-${index}`} style={styles.cityCard}>
            {editingCity === city ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.editInput}
                  value={editingValue}
                  onChangeText={setEditingValue}
                  autoFocus
                />
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={[styles.editActionButton, styles.saveButton]}
                    onPress={handleSaveEdit}
                  >
                    <Check size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editActionButton, styles.cancelButton]}
                    onPress={handleCancelEdit}
                  >
                    <X size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.cityInfo}>
                  <View style={styles.cityIconContainer}>
                    <MapPin size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.cityName}>{city}</Text>
                </View>
                <View style={styles.cityActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      console.log('Edit button pressed for:', city);
                      handleStartEdit(city);
                    }}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Edit2 size={18} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      console.log('Delete button pressed for:', city);
                      handleRemoveCity(city);
                    }}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        ))}

        {cities.length === 0 && (
          <View style={styles.emptyState}>
            <MapPin size={48} color={Colors.textLight} />
            <Text style={styles.emptyStateText}>Δεν υπάρχουν πόλεις</Text>
            <Text style={styles.emptyStateSubtext}>
              Προσθέστε την πρώτη πόλη χρησιμοποιώντας την φόρμα παραπάνω
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.card,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addSection: {
    backgroundColor: Colors.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  addInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  addInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  citiesList: {
    flex: 1,
  },
  citiesListContent: {
    padding: 16,
  },
  cityCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  cityActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  editInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#10B981',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },

});
