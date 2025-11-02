import { useCRM } from '@/contexts/CRMContext';
import { useSettings } from '@/contexts/SettingsContext';
import Colors from '@/constants/colors';
import { Plus, Search, Phone, Mail, Edit2, Heart, MapPin, Home as HomeIcon, Check, SlidersHorizontal, X } from 'lucide-react-native';
import React, { useState, useMemo, useEffect } from 'react';
import type { Client, ClientPreferences, ClientStatus, ClientCategory, PropertyType } from '@/types';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';

export default function ClientsScreen() {
  const { clients, addClient, updateClient, deleteClient, isLoading, getMatchedProperties, excludeMatch, isMatchExcluded } = useCRM();
  const { cities } = useSettings();
  const router = useRouter();
  const params = useLocalSearchParams<{ clientId?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ClientStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<ClientCategory | 'all'>('all');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showMatchedProperties, setShowMatchedProperties] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const getDefaultPreferences = (): ClientPreferences => ({
    securityDoor: false,
    elevator: false,
    alarm: false,
    view: false,
    veranda: false,
    bbq: false,
    fireplace: false,
    frontFacing: false,
    furnished: false,
    heated: false,
    internalStaircase: false,
    tents: false,
    satelliteAntenna: false,
    screens: false,
    pool: false,
    neoclassical: false,
    evCharging: false,
    reception: false,
    armchairs: false,
    investment: false,
    petsAllowed: false,
    listed: false,
    garden: false,
    underConstruction: false,
    parking: false,
    guesthouse: false,
    basement: false,
  });

  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    email: '',
    budget: '',
    preferenceText: '',
    preferences: getDefaultPreferences(),
    status: 'lead' as ClientStatus,
    category: 'buyer' as ClientCategory,
    notes: '',
    desiredPropertyType: undefined as PropertyType | undefined,
    desiredLocation: '',
    desiredLocations: [] as string[],
    minSize: '',
    maxSize: '',
    minBedrooms: '',
    maxBedrooms: '',
    minBathrooms: '',
    maxBathrooms: '',
    budgetMin: '',
    budgetMax: '',
  });

  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');

  const filteredCities = useMemo(() => {
    if (!locationQuery.trim()) return [];
    return cities.filter(city => 
      city.toLowerCase().includes(locationQuery.toLowerCase())
    ).slice(0, 5);
  }, [locationQuery, cities]);

  const filteredCitiesForSelector = useMemo(() => {
    if (!locationSearchQuery.trim()) return cities;
    return cities.filter(city => 
      city.toLowerCase().includes(locationSearchQuery.toLowerCase())
    );
  }, [locationSearchQuery, cities]);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatusFilter = filterStatus === 'all' || client.status === filterStatus;
    const matchesCategoryFilter = filterCategory === 'all' || client.category === filterCategory;
    return matchesSearch && matchesStatusFilter && matchesCategoryFilter;
  });

  const matchedProperties = useMemo(() => {
    if (!editingClient) return [];
    console.log('Recalculating matched properties for client:', editingClient.id);
    const matches = getMatchedProperties(editingClient.id).filter(m => {
      const isExcluded = isMatchExcluded(editingClient.id, m.property.id);
      console.log('Property:', m.property.id, 'isExcluded:', isExcluded);
      return !isExcluded;
    });
    console.log('Final matched properties count:', matches.length);
    return matches;
  }, [editingClient?.id, getMatchedProperties, isMatchExcluded, refreshCounter]);

  useEffect(() => {
    if (params.clientId && !isLoading) {
      const client = clients.find(c => c.id === params.clientId);
      if (client && !modalVisible) {
        handleOpenEdit(client);
      }
    }
  }, [params.clientId, clients, isLoading]);

  const handleOpenEdit = (client: Client) => {
    console.log('Opening edit for client:', client);
    setRefreshCounter(prev => prev + 1);
    setEditingClient(client);
    setNewClient({
      name: client.name,
      phone: client.phone,
      email: client.email,
      budget: client.budget.toString(),
      preferenceText: client.preferenceText || '',
      preferences: client.preferences || getDefaultPreferences(),
      status: client.status,
      category: client.category,
      notes: client.notes,
      desiredPropertyType: client.desiredPropertyType,
      desiredLocation: client.desiredLocation || '',
      desiredLocations: client.desiredLocations || [],
      minSize: client.minSize?.toString() || '',
      maxSize: client.maxSize?.toString() || '',
      minBedrooms: client.minBedrooms?.toString() || '',
      maxBedrooms: client.maxBedrooms?.toString() || '',
      minBathrooms: client.minBathrooms?.toString() || '',
      maxBathrooms: client.maxBathrooms?.toString() || '',
      budgetMin: client.budgetMin?.toString() || '',
      budgetMax: client.budgetMax?.toString() || '',
    });
    console.log('Modal will open now');
    setModalVisible(true);
  };

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.phone) return;

    const clientData = {
      ...newClient,
      budget: parseFloat(newClient.budget) || 0,
      minSize: newClient.minSize ? parseFloat(newClient.minSize) : undefined,
      maxSize: newClient.maxSize ? parseFloat(newClient.maxSize) : undefined,
      minBedrooms: newClient.minBedrooms ? parseInt(newClient.minBedrooms) : undefined,
      maxBedrooms: newClient.maxBedrooms ? parseInt(newClient.maxBedrooms) : undefined,
      minBathrooms: newClient.minBathrooms ? parseInt(newClient.minBathrooms) : undefined,
      maxBathrooms: newClient.maxBathrooms ? parseInt(newClient.maxBathrooms) : undefined,
      budgetMin: newClient.budgetMin ? parseFloat(newClient.budgetMin) : undefined,
      budgetMax: newClient.budgetMax ? parseFloat(newClient.budgetMax) : undefined,
      desiredLocation: newClient.desiredLocation || undefined,
      desiredLocations: newClient.desiredLocations.length > 0 ? newClient.desiredLocations : undefined,
    };

    if (editingClient) {
      await updateClient(editingClient.id, clientData);
    } else {
      await addClient(clientData);
    }

    setNewClient({
      name: '',
      phone: '',
      email: '',
      budget: '',
      preferenceText: '',
      preferences: getDefaultPreferences(),
      status: 'lead',
      category: 'buyer',
      notes: '',
      desiredPropertyType: undefined,
      desiredLocation: '',
      desiredLocations: [],
      minSize: '',
      maxSize: '',
      minBedrooms: '',
      maxBedrooms: '',
      minBathrooms: '',
      maxBathrooms: '',
      budgetMin: '',
      budgetMax: '',
    });
    setEditingClient(null);
    setShowMatchedProperties(false);
    setShowLocationSelector(false);
    setModalVisible(false);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingClient(null);
    setShowMatchedProperties(false);
    setShowLocationSelector(false);
    setLocationSearchQuery('');
    setNewClient({
      name: '',
      phone: '',
      email: '',
      budget: '',
      preferenceText: '',
      preferences: getDefaultPreferences(),
      status: 'lead',
      category: 'buyer',
      notes: '',
      desiredPropertyType: undefined,
      desiredLocation: '',
      desiredLocations: [],
      minSize: '',
      maxSize: '',
      minBedrooms: '',
      maxBedrooms: '',
      minBathrooms: '',
      maxBathrooms: '',
      budgetMin: '',
      budgetMax: '',
    });
  };

  const handleDeleteClient = async () => {
    if (editingClient) {
      await deleteClient(editingClient.id);
      handleCloseModal();
    }
  };

  const getStatusColor = (status: ClientStatus) => {
    switch (status) {
      case 'lead': return Colors.statusLead;
      case 'active': return Colors.statusActive;
      case 'closed': return Colors.statusClosed;
    }
  };

  const getCategoryColor = (category: ClientCategory) => {
    switch (category) {
      case 'buyer': return '#10B981';
      case 'seller': return '#F59E0B';
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
      <View style={styles.searchBar}>
        <Search size={20} color={Colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {}}
        >
          <SlidersHorizontal size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'buyer', 'seller'].map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterChip,
                filterCategory === category && styles.filterChipActive,
              ]}
              onPress={() => setFilterCategory(category as ClientCategory | 'all')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterCategory === category && styles.filterChipTextActive,
                ]}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'lead', 'active', 'closed'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                filterStatus === status && styles.filterChipActive,
              ]}
              onPress={() => setFilterStatus(status as ClientStatus | 'all')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterStatus === status && styles.filterChipTextActive,
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.listContainer}>
        {filteredClients.map((client) => (
          <TouchableOpacity key={client.id} style={styles.clientCard} onPress={() => handleOpenEdit(client)}>
            <View style={styles.clientHeader}>
              <Text style={styles.clientName}>{client.name}</Text>
              <View style={styles.badgesContainer}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(client.category) }]}>
                  <Text style={styles.categoryBadgeText}>{client.category}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(client.status) }]}>
                  <Text style={styles.statusBadgeText}>{client.status}</Text>
                </View>
              </View>
            </View>
            <View style={styles.clientInfo}>
              <View style={styles.infoRow}>
                <Phone size={16} color={Colors.textSecondary} />
                <Text style={styles.infoText}>{client.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Mail size={16} color={Colors.textSecondary} />
                <Text style={styles.infoText}>{client.email}</Text>
              </View>
            </View>
            <Text style={styles.clientBudget}>Budget: €{client.budget.toLocaleString()}</Text>
            {client.preferenceText && <Text style={styles.clientPreferences}>{client.preferenceText}</Text>}
            <View style={styles.editIcon}>
              <Edit2 size={16} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        ))}

        {filteredClients.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No clients found</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={handleCloseModal}
          />
          <View style={styles.modalContentWrapper}>
              <ScrollView style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{editingClient ? 'Edit Client' : 'Add New Client'}</Text>
                  {editingClient && (
                    <TouchableOpacity
                      style={[styles.matchButton, showMatchedProperties && styles.matchButtonActive]}
                      onPress={() => setShowMatchedProperties(!showMatchedProperties)}
                    >
                      <Heart size={20} color={showMatchedProperties ? '#fff' : Colors.primary} fill={showMatchedProperties ? '#fff' : 'none'} />
                      <Text style={[styles.matchButtonText, showMatchedProperties && styles.matchButtonTextActive]}>
                        {matchedProperties.length} Matches
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {showMatchedProperties && editingClient && (
                  <View style={styles.matchedPropertiesSection}>
                    <View style={styles.matchSectionHeader}>
                      <Text style={styles.matchSectionTitle}>ΤΑΙΡΙΑΣΜΑΤΑ ΑΚΙΝΗΤΩΝ</Text>
                      <View style={styles.matchCountBadge}>
                        <Text style={styles.matchCountText}>{matchedProperties.length}</Text>
                      </View>
                    </View>
                    {matchedProperties.length === 0 ? (
                      <View style={styles.noMatchesContainer}>
                        <HomeIcon size={48} color={Colors.textLight} />
                        <Text style={styles.noMatchesText}>Δεν βρέθηκαν ταιριάσματα</Text>
                        <Text style={styles.noMatchesSubtext}>Δοκιμάστε να ενημερώσετε τα κριτήρια αναζήτησης</Text>
                      </View>
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.matchedPropertiesList}>
                        {matchedProperties.map(({ property, matchScore }) => (
                          <View key={property.id} style={styles.matchedPropertyCard}>
                            <TouchableOpacity 
                              style={styles.removeMatchButton}
                              onPress={async () => {
                                if (editingClient) {
                                  console.log('Removing match:', editingClient.id, property.id);
                                  await excludeMatch(editingClient.id, property.id);
                                  console.log('Match removed, incrementing refresh counter');
                                  setRefreshCounter(prev => prev + 1);
                                }
                              }}
                              activeOpacity={0.7}
                            >
                              <X size={16} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.matchedPropertyCardContent}
                              onPress={() => {
                                handleCloseModal();
                                setTimeout(() => {
                                  router.push({
                                    pathname: '/properties',
                                    params: { propertyId: property.id }
                                  });
                                }, 300);
                              }} 
                              activeOpacity={0.7}
                            >
                              <View style={styles.matchedPropertyImageContainer}>
                                {property.photos.length > 0 ? (
                                  <Image
                                    source={{ uri: property.photos[0] }}
                                    style={styles.matchedPropertyImage}
                                    contentFit="cover"
                                  />
                                ) : (
                                  <View style={[styles.matchedPropertyImage, styles.matchedPropertyImagePlaceholder]}>
                                    <HomeIcon size={32} color={Colors.textLight} />
                                  </View>
                                )}
                                <View style={styles.matchScoreBadge}>
                                  <Heart size={12} color="#fff" fill="#fff" />
                                  <Text style={styles.matchScoreText}>{matchScore}%</Text>
                                </View>
                              </View>
                              <View style={styles.matchedPropertyContent}>
                                <Text style={styles.matchedPropertyTitle} numberOfLines={2}>{property.title}</Text>
                                <View style={styles.matchedPropertyLocation}>
                                  <MapPin size={12} color={Colors.textSecondary} />
                                  <Text style={styles.matchedPropertyLocationText} numberOfLines={1}>{property.location}</Text>
                                </View>
                                <Text style={styles.matchedPropertyPrice}>€{property.price.toLocaleString()}</Text>
                                <View style={styles.matchedPropertyDetails}>
                                  <View style={styles.propertyDetailItem}>
                                    <Text style={styles.matchedPropertyDetailText}>{property.size}m²</Text>
                                  </View>
                                  {property.bedrooms && (
                                    <View style={styles.propertyDetailItem}>
                                      <Text style={styles.matchedPropertyDetailText}>{property.bedrooms} υπν.</Text>
                                    </View>
                                  )}
                                  {property.bathrooms && (
                                    <View style={styles.propertyDetailItem}>
                                      <Text style={styles.matchedPropertyDetailText}>{property.bathrooms} μπν.</Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}

                <View style={styles.statusPicker}>
                  <Text style={styles.pickerLabel}>Category</Text>
                  <View style={styles.statusChipsRow}>
                    {(['buyer', 'seller'] as ClientCategory[]).map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.statusChip,
                          newClient.category === category && styles.statusChipSelected,
                        ]}
                        onPress={() => setNewClient({ ...newClient, category })}
                      >
                        <Text
                          style={[
                            styles.statusChipText,
                            newClient.category === category && styles.statusChipTextSelected,
                          ]}
                        >
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.statusPicker}>
                  <Text style={styles.pickerLabel}>Status</Text>
                  <View style={styles.statusChipsRow}>
                    {(['lead', 'active', 'closed'] as ClientStatus[]).map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusChip,
                          newClient.status === status && styles.statusChipSelected,
                        ]}
                        onPress={() => setNewClient({ ...newClient, status })}
                      >
                        <Text
                          style={[
                            styles.statusChipText,
                            newClient.status === status && styles.statusChipTextSelected,
                          ]}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter name"
                    value={newClient.name}
                    onChangeText={(text) => setNewClient({ ...newClient, name: text })}
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Phone *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter phone number"
                    value={newClient.phone}
                    onChangeText={(text) => setNewClient({ ...newClient, phone: text })}
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email address"
                    value={newClient.email}
                    onChangeText={(text) => setNewClient({ ...newClient, email: text })}
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Budget (€)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter budget"
                    value={newClient.budget}
                    keyboardType="numeric"
                    onChangeText={(text) => setNewClient({ ...newClient, budget: text })}
                  />
                </View>

                <Text style={styles.sectionTitle}>ΚΡΙΤΗΡΙΑ ΑΝΑΖΗΤΗΣΗΣ</Text>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Τύπος Ακινήτου</Text>
                  <View style={styles.propertyTypeGrid}>
                    {([{ value: undefined, label: 'Όλα', key: 'all' }, { value: 'apartment', label: 'Διαμέρισμα', key: 'apartment' }, { value: 'house', label: 'Σπίτι', key: 'house' }, { value: 'plot', label: 'Οικόπεδο', key: 'plot' }, { value: 'commercial', label: 'Εμπορικό', key: 'commercial' }] as const).map((option) => (
                      <TouchableOpacity
                        key={option.key}
                        style={[
                          styles.typeChipSmall,
                          newClient.desiredPropertyType === option.value && styles.typeChipSmallSelected,
                        ]}
                        onPress={() => setNewClient({ ...newClient, desiredPropertyType: option.value })}
                      >
                        <Text
                          style={[
                            styles.typeChipSmallText,
                            newClient.desiredPropertyType === option.value && styles.typeChipSmallTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Επιθυμητές Τοποθεσίες</Text>
                  <TouchableOpacity
                    style={styles.locationSelectorButton}
                    onPress={() => setShowLocationSelector(!showLocationSelector)}
                  >
                    <Text style={styles.locationSelectorButtonText}>
                      {newClient.desiredLocations.length === 0 
                        ? 'Επιλέξτε τοποθεσίες'
                        : `${newClient.desiredLocations.length} τοποθεσίες επιλεγμένες`
                      }
                    </Text>
                  </TouchableOpacity>
                  {newClient.desiredLocations.length > 0 && (
                    <View style={styles.selectedLocationsContainer}>
                      {newClient.desiredLocations.map((location, index) => (
                        <View key={`selected-location-${index}-${location}`} style={styles.locationChip}>
                          <Text style={styles.locationChipText}>{location}</Text>
                          <TouchableOpacity
                            onPress={() => {
                              setNewClient({
                                ...newClient,
                                desiredLocations: newClient.desiredLocations.filter((_, i) => i !== index)
                              });
                            }}
                          >
                            <Text style={styles.locationChipRemove}>×</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                  {showLocationSelector && (
                    <TouchableWithoutFeedback onPress={() => setShowLocationSelector(false)}>
                      <View style={styles.locationSelectorOverlay}>
                        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                          <View style={styles.locationSelectorContainer}>
                            <Text style={styles.locationSelectorTitle}>Διαθέσιμες Τοποθεσίες</Text>
                            <View style={styles.locationSearchContainer}>
                              <Search size={16} color={Colors.textLight} />
                              <TextInput
                                style={styles.locationSearchInput}
                                placeholder="Αναζήτηση πόλης..."
                                value={locationSearchQuery}
                                onChangeText={setLocationSearchQuery}
                              />
                              {locationSearchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setLocationSearchQuery('')}>
                                  <Text style={styles.clearSearchText}>×</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                            <ScrollView style={styles.locationList}>
                              {filteredCitiesForSelector.length === 0 ? (
                                <View style={styles.noResultsContainer}>
                                  <Text style={styles.noResultsText}>Δεν βρέθηκαν πόλεις</Text>
                                </View>
                              ) : (
                                filteredCitiesForSelector.map((city, index) => {
                                const isSelected = newClient.desiredLocations.includes(city);
                                return (
                                  <TouchableOpacity
                                    key={`city-selector-${index}-${city}`}
                                    style={[styles.locationItem, isSelected && styles.locationItemSelected]}
                                    onPress={() => {
                                      if (isSelected) {
                                        setNewClient({
                                          ...newClient,
                                          desiredLocations: newClient.desiredLocations.filter(l => l !== city)
                                        });
                                      } else {
                                        setNewClient({
                                          ...newClient,
                                          desiredLocations: [...newClient.desiredLocations, city]
                                        });
                                      }
                                    }}
                                  >
                                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                      {isSelected && <Check size={16} color="#fff" />}
                                    </View>
                                    <Text style={[styles.locationItemText, isSelected && styles.locationItemTextSelected]}>
                                      {city}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              }))}
                            </ScrollView>
                          </View>
                        </TouchableWithoutFeedback>
                      </View>
                    </TouchableWithoutFeedback>
                  )}
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Προϋπολογισμός (€)</Text>
                  <View style={styles.rangeRow}>
                    <View style={styles.rangeInputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Από"
                        value={newClient.budgetMin}
                        keyboardType="numeric"
                        onChangeText={(text) => setNewClient({ ...newClient, budgetMin: text })}
                      />
                    </View>
                    <Text style={styles.rangeSeparator}>-</Text>
                    <View style={styles.rangeInputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Έως"
                        value={newClient.budgetMax}
                        keyboardType="numeric"
                        onChangeText={(text) => setNewClient({ ...newClient, budgetMax: text, budget: text })}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Εμβαδόν (m²)</Text>
                  <View style={styles.rangeRow}>
                    <View style={styles.rangeInputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Από"
                        value={newClient.minSize}
                        keyboardType="numeric"
                        onChangeText={(text) => setNewClient({ ...newClient, minSize: text })}
                      />
                    </View>
                    <Text style={styles.rangeSeparator}>-</Text>
                    <View style={styles.rangeInputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Έως"
                        value={newClient.maxSize}
                        keyboardType="numeric"
                        onChangeText={(text) => setNewClient({ ...newClient, maxSize: text })}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Υπνοδωμάτια</Text>
                  <View style={styles.rangeRow}>
                    <View style={styles.rangeInputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Από"
                        value={newClient.minBedrooms}
                        keyboardType="numeric"
                        onChangeText={(text) => setNewClient({ ...newClient, minBedrooms: text })}
                      />
                    </View>
                    <Text style={styles.rangeSeparator}>-</Text>
                    <View style={styles.rangeInputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Έως"
                        value={newClient.maxBedrooms}
                        keyboardType="numeric"
                        onChangeText={(text) => setNewClient({ ...newClient, maxBedrooms: text })}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Μπάνια</Text>
                  <View style={styles.rangeRow}>
                    <View style={styles.rangeInputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Από"
                        value={newClient.minBathrooms}
                        keyboardType="numeric"
                        onChangeText={(text) => setNewClient({ ...newClient, minBathrooms: text })}
                      />
                    </View>
                    <Text style={styles.rangeSeparator}>-</Text>
                    <View style={styles.rangeInputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Έως"
                        value={newClient.maxBathrooms}
                        keyboardType="numeric"
                        onChangeText={(text) => setNewClient({ ...newClient, maxBathrooms: text })}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Preference Text</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 2-bedroom in city center"
                    value={newClient.preferenceText}
                    onChangeText={(text) => setNewClient({ ...newClient, preferenceText: text })}
                  />
                </View>

                <Text style={styles.sectionTitle}>ΠΡΟΤΙΜΗΣΕΙΣ ΠΕΛΑΤΗ</Text>

                {(() => {
                  const preferences = [
                    { key: 'securityDoor', label: 'Πόρτα ασφαλείας' },
                    { key: 'elevator', label: 'Ασανσέρ' },
                    { key: 'alarm', label: 'Συναγερμός' },
                    { key: 'view', label: 'Θέα' },
                    { key: 'veranda', label: 'Βεράντα' },
                    { key: 'bbq', label: 'Εντοιχισμένο BBQ' },
                    { key: 'fireplace', label: 'Τζάκι' },
                    { key: 'frontFacing', label: 'Προσόψεως' },
                    { key: 'furnished', label: 'Επιπλωμένο' },
                    { key: 'heated', label: 'Θερμένο' },
                    { key: 'internalStaircase', label: 'Εσωτερική σκάλα' },
                    { key: 'tents', label: 'Τέντες' },
                    { key: 'satelliteAntenna', label: 'Δορυφορική κεραία' },
                    { key: 'screens', label: 'Σίτες' },
                    { key: 'pool', label: 'Πισίνα' },
                    { key: 'neoclassical', label: 'Νεοκλασικό' },
                    { key: 'evCharging', label: 'Εγκαταστάσεις φόρτισης ηλεκτρικού αυτοκινήτου' },
                    { key: 'reception', label: 'Υποδοχή με θυρωρό' },
                    { key: 'armchairs', label: 'Πολυτελές' },
                    { key: 'investment', label: 'Εξοχικό' },
                    { key: 'petsAllowed', label: 'Επενδυτικό' },
                    { key: 'listed', label: 'Ιατρείο' },
                    { key: 'garden', label: 'Φοιτητικό' },
                    { key: 'underConstruction', label: 'Φωτεινό' },
                    { key: 'parking', label: 'Κατοικιείσα εμπρόσδεκτα' },
                    { key: 'guesthouse', label: 'Υπόσκαφο' },
                    { key: 'basement', label: 'Κήπος' },
                  ];
                  const rows = [];
                  for (let i = 0; i < preferences.length; i += 2) {
                    rows.push(
                      <View key={`pref-row-${i}-${preferences[i]?.key || 'unknown'}`} style={styles.row}>
                        <View style={[styles.fieldContainer, { flex: 1 }]}>
                          <Text style={styles.fieldLabel}>{preferences[i].label}</Text>
                          <View style={styles.yesNoContainer}>
                            <TouchableOpacity 
                              style={[styles.yesNoButton, newClient.preferences[preferences[i].key as keyof ClientPreferences] && styles.yesNoButtonActive]}
                              onPress={() => setNewClient({ 
                                ...newClient, 
                                preferences: { ...newClient.preferences, [preferences[i].key]: true } 
                              })}
                            >
                              <Text style={[styles.yesNoText, newClient.preferences[preferences[i].key as keyof ClientPreferences] && styles.yesNoTextActive]}>ΝΑΙ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={[styles.yesNoButton, !newClient.preferences[preferences[i].key as keyof ClientPreferences] && styles.yesNoButtonActive]}
                              onPress={() => setNewClient({ 
                                ...newClient, 
                                preferences: { ...newClient.preferences, [preferences[i].key]: false } 
                              })}
                            >
                              <Text style={[styles.yesNoText, !newClient.preferences[preferences[i].key as keyof ClientPreferences] && styles.yesNoTextActive]}>ΟΧΙ</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                        {i + 1 < preferences.length && (
                          <View style={[styles.fieldContainer, { flex: 1 }]}>
                            <Text style={styles.fieldLabel}>{preferences[i + 1].label}</Text>
                            <View style={styles.yesNoContainer}>
                              <TouchableOpacity 
                                style={[styles.yesNoButton, newClient.preferences[preferences[i + 1].key as keyof ClientPreferences] && styles.yesNoButtonActive]}
                                onPress={() => setNewClient({ 
                                  ...newClient, 
                                  preferences: { ...newClient.preferences, [preferences[i + 1].key]: true } 
                                })}
                              >
                                <Text style={[styles.yesNoText, newClient.preferences[preferences[i + 1].key as keyof ClientPreferences] && styles.yesNoTextActive]}>ΝΑΙ</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={[styles.yesNoButton, !newClient.preferences[preferences[i + 1].key as keyof ClientPreferences] && styles.yesNoButtonActive]}
                                onPress={() => setNewClient({ 
                                  ...newClient, 
                                  preferences: { ...newClient.preferences, [preferences[i + 1].key]: false } 
                                })}
                              >
                                <Text style={[styles.yesNoText, !newClient.preferences[preferences[i + 1].key as keyof ClientPreferences] && styles.yesNoTextActive]}>ΟΧΙ</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  }
                  return rows;
                })()}

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Additional notes"
                    value={newClient.notes}
                    multiline
                    numberOfLines={3}
                    onChangeText={(text) => setNewClient({ ...newClient, notes: text })}
                  />
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={handleCloseModal}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  {editingClient && (
                    <TouchableOpacity
                      style={[styles.modalButton, styles.deleteButton]}
                      onPress={handleDeleteClient}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.modalButton, styles.submitButton]}
                    onPress={handleAddClient}
                  >
                    <Text style={styles.submitButtonText}>{editingClient ? 'Save' : 'Add Client'}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.text,
  },
  filterButton: {
    padding: 8,
    position: 'relative',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600' as const,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  clientCard: {
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
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingRight: 36,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    flexShrink: 1,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#fff',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
    textTransform: 'capitalize',
  },
  clientInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  clientBudget: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  clientPreferences: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  editIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContentWrapper: {
    maxHeight: '90%',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 24,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  statusPicker: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  statusChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statusChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusChipText: {
    fontSize: 14,
    color: Colors.text,
  },
  statusChipTextSelected: {
    color: '#fff',
    fontWeight: '600' as const,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 24,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  yesNoContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  yesNoButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  yesNoButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  yesNoText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  yesNoTextActive: {
    color: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  matchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  matchButtonActive: {
    backgroundColor: Colors.primary,
  },
  matchButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  matchButtonTextActive: {
    color: '#fff',
  },
  matchedPropertiesSection: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  matchSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  matchSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  matchCountBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  matchCountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  matchedPropertiesList: {
    marginTop: 8,
  },
  matchedPropertyCard: {
    width: 220,
    backgroundColor: Colors.background,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  matchedPropertyCardContent: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  removeMatchButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  matchedPropertyImageContainer: {
    position: 'relative',
  },
  matchedPropertyImage: {
    width: '100%',
    height: 140,
  },
  matchedPropertyImagePlaceholder: {
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchScoreBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  matchScoreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  matchedPropertyContent: {
    padding: 14,
  },
  matchedPropertyTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
    lineHeight: 20,
  },
  matchedPropertyLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  matchedPropertyLocationText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  matchedPropertyPrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 8,
  },
  matchedPropertyDetails: {
    flexDirection: 'row',
    gap: 6,
  },
  propertyDetailItem: {
    backgroundColor: Colors.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matchedPropertyDetailText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  noMatchesContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMatchesText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  noMatchesSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  typeChipSmall: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  typeChipSmallSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeChipSmallText: {
    fontSize: 12,
    color: Colors.text,
  },
  typeChipSmallTextSelected: {
    color: '#fff',
    fontWeight: '600' as const,
  },
  rangeSeparator: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginHorizontal: 8,
    alignSelf: 'center',
  },
  propertyTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rangeInputContainer: {
    flex: 1,
    minWidth: 0,
  },
  autocompleteContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10000,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionText: {
    fontSize: 15,
    color: Colors.text,
  },
  locationSelectorButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
  },
  locationSelectorButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  selectedLocationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  locationChipText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600' as const,
  },
  locationChipRemove: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700' as const,
    lineHeight: 20,
  },
  locationSelectorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  locationSelectorContainer: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginTop: 12,
    maxHeight: 300,
  },
  locationSelectorTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  locationList: {
    maxHeight: 250,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  locationItemSelected: {
    backgroundColor: `${Colors.primary}15`,
  },
  locationItemText: {
    fontSize: 15,
    color: Colors.text,
  },
  locationItemTextSelected: {
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  locationSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  locationSearchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  clearSearchText: {
    fontSize: 24,
    color: Colors.textSecondary,
    fontWeight: '700' as const,
    lineHeight: 24,
  },
  noResultsContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
});
