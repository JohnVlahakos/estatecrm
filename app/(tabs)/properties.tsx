import { useCRM } from '@/contexts/CRMContext';
import { useSettings } from '@/contexts/SettingsContext';
import Colors from '@/constants/colors';
import { Plus, Search, MapPin, Edit2, SlidersHorizontal, X, Building2, Banknote, Maximize2, Home, Bed, Bath, Layers, Calendar, Minus, Clock, Bell, Upload, ImageIcon, Trash2, Check } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import type { Property, PropertyFeatures, PropertyStatus, PropertyType } from '@/types';
import { useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';


interface PropertyFilters {
  status: PropertyStatus | 'all';
  type: PropertyType | 'all';
  priceMin: string;
  priceMax: string;
  sizeMin: string;
  sizeMax: string;
  bedrooms: string;
  bathrooms: string;
  features: string[];
}

export default function PropertiesScreen() {
  const { properties, addProperty, updateProperty, deleteProperty, isLoading } = useCRM();
  const { cities } = useSettings();
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [filtersModalVisible, setFiltersModalVisible] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  
  const [filters, setFilters] = useState<PropertyFilters>({
    status: 'all',
    type: 'all',
    priceMin: '',
    priceMax: '',
    sizeMin: '',
    sizeMax: '',
    bedrooms: '',
    bathrooms: '',
    features: [],
  });

  const getDefaultFeatures = (): PropertyFeatures => ({
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

  const [newProperty, setNewProperty] = useState({
    title: '',
    type: 'apartment' as PropertyType,
    location: '',
    size: '',
    price: '',
    bedrooms: 0,
    bathrooms: 0,
    description: '',
    photos: [] as string[],
    status: 'active' as PropertyStatus,
    floors: 1,
    kitchens: 0,
    wc: 0,
    livingRooms: 0,
    storage: false,
    attic: false,
    playroom: false,
    features: getDefaultFeatures(),
    rentalMonths: '',
    rentalYears: '',
  });

  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [isAtBottom, setIsAtBottom] = useState(false);

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filters.status === 'all' || property.status === filters.status;
    const matchesType = filters.type === 'all' || property.type === filters.type;
    
    const matchesPriceMin = !filters.priceMin || property.price >= parseFloat(filters.priceMin);
    const matchesPriceMax = !filters.priceMax || property.price <= parseFloat(filters.priceMax);
    const matchesSizeMin = !filters.sizeMin || property.size >= parseFloat(filters.sizeMin);
    const matchesSizeMax = !filters.sizeMax || property.size <= parseFloat(filters.sizeMax);
    const matchesBedrooms = !filters.bedrooms || property.bedrooms === parseInt(filters.bedrooms);
    const matchesBathrooms = !filters.bathrooms || property.bathrooms === parseInt(filters.bathrooms);
    
    return matchesSearch && matchesStatus && matchesType && matchesPriceMin && matchesPriceMax && 
           matchesSizeMin && matchesSizeMax && matchesBedrooms && matchesBathrooms;
  });

  const activeFiltersCount = [
    filters.status !== 'all',
    filters.type !== 'all',
    filters.priceMin,
    filters.priceMax,
    filters.sizeMin,
    filters.sizeMax,
    filters.bedrooms,
    filters.bathrooms,
    filters.features.length > 0,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setFilters({
      status: 'all',
      type: 'all',
      priceMin: '',
      priceMax: '',
      sizeMin: '',
      sizeMax: '',
      bedrooms: '',
      bathrooms: '',
      features: [],
    });
  };

  const toggleFeature = (feature: string) => {
    setFilters(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const handleOpenEdit = (property: Property) => {
    setEditingProperty(property);
    setNewProperty({
      title: property.title || '',
      type: property.type || 'apartment',
      location: property.location || '',
      size: property.size?.toString() || '',
      price: property.price?.toString() || '',
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      description: property.description || '',
      photos: property.photos || [],
      status: property.status || 'active',
      floors: property.floors || 1,
      kitchens: property.kitchens || 0,
      wc: property.wc || 0,
      livingRooms: property.livingRooms || 0,
      storage: property.storage || false,
      attic: property.attic || false,
      playroom: property.playroom || false,
      features: property.features || getDefaultFeatures(),
      rentalMonths: property.rentalInfo?.availableAfterMonths?.toString() || '',
      rentalYears: property.rentalInfo?.availableAfterYears?.toString() || '',
    });
    setModalVisible(true);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS !== 'web') {
          Alert.alert('Permission needed', 'Please allow access to your photo library to upload images.');
        }
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map(asset => {
          if (asset.base64) {
            return `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
          }
          return asset.uri;
        });
        setNewProperty(prev => ({
          ...prev,
          photos: [...prev.photos, ...newPhotos],
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to pick image. Please try again.');
      }
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS !== 'web') {
          Alert.alert('Permission needed', 'Please allow camera access to take photos.');
        }
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const photoUri = asset.base64
          ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
        setNewProperty(prev => ({
          ...prev,
          photos: [...prev.photos, photoUri],
        }));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to take photo. Please try again.');
      }
    }
  };

  const removePhoto = (index: number) => {
    setNewProperty(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleAddProperty = async () => {
    if (!newProperty.title || !newProperty.location) return;

    let rentalInfo = undefined;
    if (newProperty.status === 'rented' && (newProperty.rentalMonths || newProperty.rentalYears)) {
      const months = parseInt(newProperty.rentalMonths) || 0;
      const years = parseInt(newProperty.rentalYears) || 0;
      const totalMonths = months + (years * 12);

      if (totalMonths > 0) {
        const availabilityDate = new Date();
        availabilityDate.setMonth(availabilityDate.getMonth() + totalMonths);

        rentalInfo = {
          rentedDate: new Date().toISOString(),
          availableAfterMonths: months,
          availableAfterYears: years,
          availabilityDate: availabilityDate.toISOString(),
        };
      }
    }

    const propertyData = {
      ...newProperty,
      size: parseFloat(newProperty.size) || 0,
      price: parseFloat(newProperty.price) || 0,
      bedrooms: newProperty.bedrooms || undefined,
      bathrooms: newProperty.bathrooms || undefined,
      floors: newProperty.floors || undefined,
      kitchens: newProperty.kitchens || undefined,
      wc: newProperty.wc || undefined,
      livingRooms: newProperty.livingRooms || undefined,
      rentalInfo,
    };

    if (editingProperty) {
      await updateProperty(editingProperty.id, propertyData);
    } else {
      await addProperty(propertyData);
    }

    setNewProperty({
      title: '',
      type: 'apartment',
      location: '',
      size: '',
      price: '',
      bedrooms: 0,
      bathrooms: 0,
      description: '',
      photos: [],
      status: 'active',
      floors: 1,
      kitchens: 0,
      wc: 0,
      livingRooms: 0,
      storage: false,
      attic: false,
      playroom: false,
      features: getDefaultFeatures(),
      rentalMonths: '',
      rentalYears: '',
    });
    setEditingProperty(null);
    setShowLocationSelector(false);
    setLocationSearchQuery('');
    setModalVisible(false);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingProperty(null);
    setShowLocationSelector(false);
    setLocationSearchQuery('');
    setNewProperty({
      title: '',
      type: 'apartment',
      location: '',
      size: '',
      price: '',
      bedrooms: 0,
      bathrooms: 0,
      description: '',
      photos: [],
      status: 'active',
      floors: 1,
      kitchens: 0,
      wc: 0,
      livingRooms: 0,
      storage: false,
      attic: false,
      playroom: false,
      features: getDefaultFeatures(),
      rentalMonths: '',
      rentalYears: '',
    });
  };

  const handleDeleteProperty = async () => {
    if (editingProperty) {
      await deleteProperty(editingProperty.id);
      handleCloseModal();
    }
  };

  const getStatusColor = (status: PropertyStatus) => {
    switch (status) {
      case 'active': return Colors.statusActive;
      case 'rented': return Colors.statusRented;
      case 'sold': return Colors.statusSold;
    }
  };

  useEffect(() => {
    if (params.propertyId && typeof params.propertyId === 'string' && properties.length > 0) {
      const property = properties.find(p => p.id === params.propertyId);
      if (property) {
        handleOpenEdit(property);
      }
    }
  }, [params.propertyId, properties]);

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
          placeholder="Search properties..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFiltersModalVisible(true)}
        >
          <SlidersHorizontal size={20} color={Colors.primary} />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'active', 'rented', 'sold'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                filters.status === status && styles.filterChipActive,
              ]}
              onPress={() => setFilters(prev => ({ ...prev, status: status as PropertyStatus | 'all' }))}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filters.status === status && styles.filterChipTextActive,
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.listContainer}>
        {filteredProperties.map((property) => (
          <TouchableOpacity key={property.id} style={styles.propertyCard} onPress={() => handleOpenEdit(property)}>
            {property.photos.length > 0 && (
              <Image
                source={{ uri: property.photos[0] }}
                style={styles.propertyImage}
                contentFit="cover"
              />
            )}
            <View style={styles.propertyContent}>
              <View style={styles.propertyHeader}>
                <Text style={styles.propertyTitle}>{property.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(property.status) }]}>
                  <Text style={styles.statusBadgeText}>{property.status}</Text>
                </View>
              </View>
              <View style={styles.locationRow}>
                <MapPin size={16} color={Colors.textSecondary} />
                <Text style={styles.locationText}>{property.location}</Text>
              </View>
              <Text style={styles.propertyPrice}>€{property.price.toLocaleString()}</Text>
              <View style={styles.propertyDetails}>
                <Text style={styles.detailText}>{property.size}m²</Text>
                {property.bedrooms && (
                  <Text style={styles.detailText}>{property.bedrooms} bed</Text>
                )}
                {property.bathrooms && (
                  <Text style={styles.detailText}>{property.bathrooms} bath</Text>
                )}
              </View>
            </View>
            <View style={styles.editIcon}>
              <Edit2 size={20} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        ))}

        {filteredProperties.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No properties found</Text>
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
        visible={filtersModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFiltersModalVisible(false)}
      >
        <View style={styles.filtersModalOverlay}>
          <View style={styles.filtersModalContent}>
            <View style={styles.filtersHeader}>
              <TouchableOpacity onPress={() => setFiltersModalVisible(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.filtersTitle}>Φίλτρα</Text>
              <TouchableOpacity onPress={resetFilters}>
                <Text style={styles.clearFiltersText}>Καθαρισμός</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filtersScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Building2 size={20} color={Colors.textSecondary} />
                  <Text style={styles.filterSectionTitle}>Υποκατηγορία</Text>
                </View>
                <View style={styles.filterOptionsRow}>
                  {[{ value: 'all', label: 'Όλα' }, { value: 'apartment', label: 'Διαμέρισμα' }, { value: 'house', label: 'Σπίτι' }, { value: 'plot', label: 'Οικόπεδο' }, { value: 'commercial', label: 'Εμπορικό' }].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterOption,
                        filters.type === option.value && styles.filterOptionActive,
                      ]}
                      onPress={() => setFilters(prev => ({ ...prev, type: option.value as PropertyType | 'all' }))}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filters.type === option.value && styles.filterOptionTextActive,
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Banknote size={20} color={Colors.textSecondary} />
                  <Text style={styles.filterSectionTitle}>Τιμή</Text>
                  <Text style={styles.filterSectionSubtitle}>Αδιάφορο</Text>
                </View>
                <View style={styles.rangeInputsRow}>
                  <TextInput
                    style={styles.rangeInput}
                    placeholder="Από"
                    keyboardType="numeric"
                    value={filters.priceMin}
                    onChangeText={(text) => setFilters(prev => ({ ...prev, priceMin: text }))}
                  />
                  <Text style={styles.rangeSeparator}>-</Text>
                  <TextInput
                    style={styles.rangeInput}
                    placeholder="Έως"
                    keyboardType="numeric"
                    value={filters.priceMax}
                    onChangeText={(text) => setFilters(prev => ({ ...prev, priceMax: text }))}
                  />
                </View>
              </View>

              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Maximize2 size={20} color={Colors.textSecondary} />
                  <Text style={styles.filterSectionTitle}>Εμβαδόν</Text>
                  <Text style={styles.filterSectionSubtitle}>Αδιάφορο</Text>
                </View>
                <View style={styles.rangeInputsRow}>
                  <TextInput
                    style={styles.rangeInput}
                    placeholder="Από (m²)"
                    keyboardType="numeric"
                    value={filters.sizeMin}
                    onChangeText={(text) => setFilters(prev => ({ ...prev, sizeMin: text }))}
                  />
                  <Text style={styles.rangeSeparator}>-</Text>
                  <TextInput
                    style={styles.rangeInput}
                    placeholder="Έως (m²)"
                    keyboardType="numeric"
                    value={filters.sizeMax}
                    onChangeText={(text) => setFilters(prev => ({ ...prev, sizeMax: text }))}
                  />
                </View>
              </View>

              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Home size={20} color={Colors.textSecondary} />
                  <Text style={styles.filterSectionTitle}>Είδος ακινήτου</Text>
                </View>
                <View style={styles.filterOptionsRow}>
                  {[{ value: 'all', label: 'Όλα' }, { value: 'active', label: 'Νεόδμητο' }, { value: 'rented', label: 'Φοιτητική κατοικία' }].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterOption,
                        filters.status === option.value && styles.filterOptionActive,
                      ]}
                      onPress={() => setFilters(prev => ({ ...prev, status: option.value as PropertyStatus | 'all' }))}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filters.status === option.value && styles.filterOptionTextActive,
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Text style={styles.filterSectionTitle}>Μόνο με</Text>
                </View>
                <View style={styles.filterOptionsRow}>
                  {['Εικόνες', 'Μειωμένη τιμή'].map((feature) => (
                    <TouchableOpacity
                      key={feature}
                      style={[
                        styles.filterOption,
                        filters.features.includes(feature) && styles.filterOptionActive,
                      ]}
                      onPress={() => toggleFeature(feature)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filters.features.includes(feature) && styles.filterOptionTextActive,
                      ]}>
                        {feature}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Bed size={20} color={Colors.textSecondary} />
                  <Text style={styles.filterSectionTitle}>Υπνοδωμάτια</Text>
                  <Text style={styles.filterSectionSubtitle}>Από {filters.bedrooms || '...'}</Text>
                </View>
                <View style={styles.rangeInputsRow}>
                  <TextInput
                    style={[styles.rangeInput, { flex: 1 }]}
                    placeholder="Αριθμός υπνοδωματίων"
                    keyboardType="numeric"
                    value={filters.bedrooms}
                    onChangeText={(text) => setFilters(prev => ({ ...prev, bedrooms: text }))}
                  />
                </View>
              </View>

              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Bath size={20} color={Colors.textSecondary} />
                  <Text style={styles.filterSectionTitle}>Μπάνια (ελάχ)</Text>
                  <Text style={styles.filterSectionSubtitle}>Αδιάφορο</Text>
                </View>
                <View style={styles.rangeInputsRow}>
                  <TextInput
                    style={[styles.rangeInput, { flex: 1 }]}
                    placeholder="Αριθμός μπάνιων"
                    keyboardType="numeric"
                    value={filters.bathrooms}
                    onChangeText={(text) => setFilters(prev => ({ ...prev, bathrooms: text }))}
                  />
                </View>
              </View>

              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Layers size={20} color={Colors.textSecondary} />
                  <Text style={styles.filterSectionTitle}>Όροφος</Text>
                  <Text style={styles.filterSectionSubtitle}>Αδιάφορο</Text>
                </View>
              </View>

              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Calendar size={20} color={Colors.textSecondary} />
                  <Text style={styles.filterSectionTitle}>Έτος κατασκευής</Text>
                  <Text style={styles.filterSectionSubtitle}>Αδιάφορο</Text>
                </View>
              </View>

              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Text style={styles.filterSectionTitle}>Χαρακτηριστικά</Text>
                </View>
                <View style={styles.filterOptionsRow}>
                  {['Επιπλωμένο', 'Αποθήκη', 'Πόρτα ασφαλείας'].map((feature) => (
                    <TouchableOpacity
                      key={feature}
                      style={[
                        styles.filterOption,
                        filters.features.includes(feature) && styles.filterOptionActive,
                      ]}
                      onPress={() => toggleFeature(feature)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filters.features.includes(feature) && styles.filterOptionTextActive,
                      ]}>
                        {feature}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.filtersFooter}>
              <TouchableOpacity 
                style={styles.applyFiltersButton}
                onPress={() => setFiltersModalVisible(false)}
              >
                <Text style={styles.applyFiltersButtonText}>
                  {filteredProperties.length} αποτελέσματα
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={handleCloseModal}
          />
          <ScrollView 
            style={styles.modalScrollView}
            onScroll={(event) => {
              const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
              const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
              setIsAtBottom(isBottom);
            }}
            scrollEventThrottle={16}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingProperty ? 'Edit Property' : 'Add New Property'}</Text>

              <View style={styles.statusPicker}>
                <Text style={styles.pickerLabel}>Status</Text>
                <View style={styles.statusChipsRow}>
                  {(['active', 'rented', 'sold'] as PropertyStatus[]).map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusChip,
                        newProperty.status === status && styles.statusChipSelected,
                      ]}
                      onPress={() => setNewProperty({ ...newProperty, status })}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          newProperty.status === status && styles.statusChipTextSelected,
                        ]}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.typePicker}>
                <Text style={styles.pickerLabel}>Type</Text>
                <View style={styles.statusChipsRow}>
                  {(['apartment', 'house', 'plot', 'commercial'] as PropertyType[]).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeChip,
                        newProperty.type === type && styles.typeChipSelected,
                      ]}
                      onPress={() => setNewProperty({ ...newProperty, type })}
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          newProperty.type === type && styles.typeChipTextSelected,
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter property title"
                  value={newProperty.title}
                  onChangeText={(text) => setNewProperty({ ...newProperty, title: text })}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Location *</Text>
                <TouchableOpacity
                  style={styles.locationSelectorButton}
                  onPress={() => setShowLocationSelector(!showLocationSelector)}
                >
                  <Text style={[styles.locationSelectorButtonText, !newProperty.location && styles.locationPlaceholder]}>
                    {newProperty.location || 'Επιλέξτε τοποθεσία'}
                  </Text>
                </TouchableOpacity>
                {showLocationSelector && (
                  <View style={styles.locationSelectorContainer}>
                    <View style={styles.locationSearchContainer}>
                      <Search size={16} color={Colors.textLight} />
                      <TextInput
                        style={styles.locationSearchInput}
                        placeholder="Αναζήτηση πόλης..."
                        value={locationSearchQuery}
                        onChangeText={setLocationSearchQuery}
                        autoFocus
                      />
                    </View>
                    <ScrollView style={styles.locationList}>
                      {cities
                        .filter(city => 
                          city.toLowerCase().includes(locationSearchQuery.toLowerCase())
                        )
                        .sort()
                        .map((city, index) => {
                          const isSelected = newProperty.location === city;
                          return (
                            <TouchableOpacity
                              key={`property-city-${index}-${city}`}
                              style={[styles.locationItem, isSelected && styles.locationItemSelected]}
                              onPress={() => {
                                setNewProperty({ ...newProperty, location: city });
                                setShowLocationSelector(false);
                                setLocationSearchQuery('');
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
                        })}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Price (€)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter price"
                  value={newProperty.price}
                  keyboardType="numeric"
                  onChangeText={(text) => setNewProperty({ ...newProperty, price: text })}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Size (m²)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter size in square meters"
                  value={newProperty.size}
                  keyboardType="numeric"
                  onChangeText={(text) => setNewProperty({ ...newProperty, size: text })}
                />
              </View>

              <Text style={styles.sectionTitle}>ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ</Text>

              <View style={styles.row}>
                <View style={[styles.fieldContainer, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Επίπεδα</Text>
                  <View style={styles.counterContainer}>
                    <TouchableOpacity 
                      style={styles.counterButton}
                      onPress={() => setNewProperty({ ...newProperty, floors: Math.max(1, newProperty.floors - 1) })}
                    >
                      <Minus size={20} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{newProperty.floors}</Text>
                    <TouchableOpacity 
                      style={styles.counterButton}
                      onPress={() => setNewProperty({ ...newProperty, floors: newProperty.floors + 1 })}
                    >
                      <Plus size={20} color={Colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={[styles.fieldContainer, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Υπνοδωμάτια</Text>
                  <View style={styles.counterContainer}>
                    <TouchableOpacity 
                      style={styles.counterButton}
                      onPress={() => setNewProperty({ ...newProperty, bedrooms: Math.max(0, newProperty.bedrooms - 1) })}
                    >
                      <Minus size={20} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{newProperty.bedrooms}</Text>
                    <TouchableOpacity 
                      style={styles.counterButton}
                      onPress={() => setNewProperty({ ...newProperty, bedrooms: newProperty.bedrooms + 1 })}
                    >
                      <Plus size={20} color={Colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.fieldContainer, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Κουζίνες</Text>
                  <View style={styles.counterContainer}>
                    <TouchableOpacity 
                      style={styles.counterButton}
                      onPress={() => setNewProperty({ ...newProperty, kitchens: Math.max(0, newProperty.kitchens - 1) })}
                    >
                      <Minus size={20} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{newProperty.kitchens}</Text>
                    <TouchableOpacity 
                      style={styles.counterButton}
                      onPress={() => setNewProperty({ ...newProperty, kitchens: newProperty.kitchens + 1 })}
                    >
                      <Plus size={20} color={Colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={[styles.fieldContainer, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Μπάνια</Text>
                  <View style={styles.counterContainer}>
                    <TouchableOpacity 
                      style={styles.counterButton}
                      onPress={() => setNewProperty({ ...newProperty, bathrooms: Math.max(0, newProperty.bathrooms - 1) })}
                    >
                      <Minus size={20} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{newProperty.bathrooms}</Text>
                    <TouchableOpacity 
                      style={styles.counterButton}
                      onPress={() => setNewProperty({ ...newProperty, bathrooms: newProperty.bathrooms + 1 })}
                    >
                      <Plus size={20} color={Colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.fieldContainer, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>WC</Text>
                  <View style={styles.counterContainer}>
                    <TouchableOpacity 
                      style={styles.counterButton}
                      onPress={() => setNewProperty({ ...newProperty, wc: Math.max(0, newProperty.wc - 1) })}
                    >
                      <Minus size={20} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{newProperty.wc}</Text>
                    <TouchableOpacity 
                      style={styles.counterButton}
                      onPress={() => setNewProperty({ ...newProperty, wc: newProperty.wc + 1 })}
                    >
                      <Plus size={20} color={Colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={[styles.fieldContainer, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Σαλόνια</Text>
                  <View style={styles.counterContainer}>
                    <TouchableOpacity 
                      style={styles.counterButton}
                      onPress={() => setNewProperty({ ...newProperty, livingRooms: Math.max(0, newProperty.livingRooms - 1) })}
                    >
                      <Minus size={20} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{newProperty.livingRooms}</Text>
                    <TouchableOpacity 
                      style={styles.counterButton}
                      onPress={() => setNewProperty({ ...newProperty, livingRooms: newProperty.livingRooms + 1 })}
                    >
                      <Plus size={20} color={Colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.fieldContainer, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Αποθήκη</Text>
                  <View style={styles.yesNoContainer}>
                    <TouchableOpacity 
                      style={[styles.yesNoButton, newProperty.storage && styles.yesNoButtonActive]}
                      onPress={() => setNewProperty({ ...newProperty, storage: true })}
                    >
                      <Text style={[styles.yesNoText, newProperty.storage && styles.yesNoTextActive]}>ΝΑΙ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.yesNoButton, !newProperty.storage && styles.yesNoButtonActive]}
                      onPress={() => setNewProperty({ ...newProperty, storage: false })}
                    >
                      <Text style={[styles.yesNoText, !newProperty.storage && styles.yesNoTextActive]}>ΟΧΙ</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={[styles.fieldContainer, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Σοφίτα</Text>
                  <View style={styles.yesNoContainer}>
                    <TouchableOpacity 
                      style={[styles.yesNoButton, newProperty.attic && styles.yesNoButtonActive]}
                      onPress={() => setNewProperty({ ...newProperty, attic: true })}
                    >
                      <Text style={[styles.yesNoText, newProperty.attic && styles.yesNoTextActive]}>ΝΑΙ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.yesNoButton, !newProperty.attic && styles.yesNoButtonActive]}
                      onPress={() => setNewProperty({ ...newProperty, attic: false })}
                    >
                      <Text style={[styles.yesNoText, !newProperty.attic && styles.yesNoTextActive]}>ΟΧΙ</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Playroom</Text>
                <View style={styles.yesNoContainer}>
                  <TouchableOpacity 
                    style={[styles.yesNoButton, newProperty.playroom && styles.yesNoButtonActive]}
                    onPress={() => setNewProperty({ ...newProperty, playroom: true })}
                  >
                    <Text style={[styles.yesNoText, newProperty.playroom && styles.yesNoTextActive]}>ΝΑΙ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.yesNoButton, !newProperty.playroom && styles.yesNoButtonActive]}
                    onPress={() => setNewProperty({ ...newProperty, playroom: false })}
                  >
                    <Text style={[styles.yesNoText, !newProperty.playroom && styles.yesNoTextActive]}>ΟΧΙ</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.sectionTitle}>ΣΥΜΠΛΗΡΩΣΕ ΤΑ ΠΕΔΙΑ ΜΕ ΝΑΙ Ή ΟΧΙ</Text>

              {(() => {
                const features = [
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
                for (let i = 0; i < features.length; i += 2) {
                  const firstFeature = features[i];
                  const secondFeature = features[i + 1];
                  rows.push(
                    <View key={`feat-row-${i}-${firstFeature.key}-${secondFeature?.key || 'single'}`} style={styles.row}>
                      <View style={[styles.fieldContainer, { flex: 1 }]}>
                        <Text style={styles.fieldLabel}>{firstFeature.label}</Text>
                        <View style={styles.yesNoContainer}>
                          <TouchableOpacity 
                            style={[styles.yesNoButton, newProperty.features[firstFeature.key as keyof PropertyFeatures] && styles.yesNoButtonActive]}
                            onPress={() => setNewProperty({ 
                              ...newProperty, 
                              features: { ...newProperty.features, [firstFeature.key]: true } 
                            })}
                          >
                            <Text style={[styles.yesNoText, newProperty.features[firstFeature.key as keyof PropertyFeatures] && styles.yesNoTextActive]}>ΝΑΙ</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.yesNoButton, !newProperty.features[firstFeature.key as keyof PropertyFeatures] && styles.yesNoButtonActive]}
                            onPress={() => setNewProperty({ 
                              ...newProperty, 
                              features: { ...newProperty.features, [firstFeature.key]: false } 
                            })}
                          >
                            <Text style={[styles.yesNoText, !newProperty.features[firstFeature.key as keyof PropertyFeatures] && styles.yesNoTextActive]}>ΟΧΙ</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      {secondFeature && (
                        <View style={[styles.fieldContainer, { flex: 1 }]}>
                          <Text style={styles.fieldLabel}>{secondFeature.label}</Text>
                          <View style={styles.yesNoContainer}>
                            <TouchableOpacity 
                              style={[styles.yesNoButton, newProperty.features[secondFeature.key as keyof PropertyFeatures] && styles.yesNoButtonActive]}
                              onPress={() => setNewProperty({ 
                                ...newProperty, 
                                features: { ...newProperty.features, [secondFeature.key]: true } 
                              })}
                            >
                              <Text style={[styles.yesNoText, newProperty.features[secondFeature.key as keyof PropertyFeatures] && styles.yesNoTextActive]}>ΝΑΙ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={[styles.yesNoButton, !newProperty.features[secondFeature.key as keyof PropertyFeatures] && styles.yesNoButtonActive]}
                              onPress={() => setNewProperty({ 
                                ...newProperty, 
                                features: { ...newProperty.features, [secondFeature.key]: false } 
                              })}
                            >
                              <Text style={[styles.yesNoText, !newProperty.features[secondFeature.key as keyof PropertyFeatures] && styles.yesNoTextActive]}>ΟΧΙ</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                }
                return rows;
              })()}

              {newProperty.status === 'rented' && (
                <>
                  <Text style={styles.sectionTitle}>RENTAL AVAILABILITY</Text>
                  <View style={styles.rentalInfoCard}>
                    <View style={styles.rentalInfoHeader}>
                      <Bell size={20} color={Colors.primary} />
                      <Text style={styles.rentalInfoTitle}>Set Availability Notification</Text>
                    </View>
                    <Text style={styles.rentalInfoSubtitle}>
                      When will this property become available again? You&apos;ll receive a notification 7 days before.
                    </Text>

                    <View style={styles.row}>
                      <View style={[styles.fieldContainer, { flex: 1 }]}>
                        <Text style={styles.fieldLabel}>Years</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="0"
                          keyboardType="numeric"
                          value={newProperty.rentalYears}
                          onChangeText={(text) => setNewProperty({ ...newProperty, rentalYears: text })}
                        />
                      </View>
                      <View style={[styles.fieldContainer, { flex: 1 }]}>
                        <Text style={styles.fieldLabel}>Months</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="0"
                          keyboardType="numeric"
                          value={newProperty.rentalMonths}
                          onChangeText={(text) => setNewProperty({ ...newProperty, rentalMonths: text })}
                        />
                      </View>
                    </View>

                    {(newProperty.rentalMonths || newProperty.rentalYears) && (
                      <View style={styles.availabilityPreview}>
                        <Clock size={16} color={Colors.textSecondary} />
                        <Text style={styles.availabilityPreviewText}>
                          Available on: {new Date(new Date().setMonth(new Date().getMonth() + (parseInt(newProperty.rentalMonths) || 0) + ((parseInt(newProperty.rentalYears) || 0) * 12))).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              )}

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Photos</Text>
                <View style={styles.photoUploadContainer}>
                  {newProperty.photos.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosList}>
                      {newProperty.photos.map((photo, index) => (
                        <View key={index} style={styles.photoItem}>
                          <Image
                            source={{ uri: photo }}
                            style={styles.photoThumbnail}
                            contentFit="cover"
                          />
                          <TouchableOpacity
                            style={styles.removePhotoButton}
                            onPress={() => removePhoto(index)}
                          >
                            <Trash2 size={16} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  )}
                  <View style={styles.uploadButtonsRow}>
                    <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                      <ImageIcon size={20} color={Colors.primary} />
                      <Text style={styles.uploadButtonText}>Choose Photos</Text>
                    </TouchableOpacity>
                    {Platform.OS !== 'web' && (
                      <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                        <Upload size={20} color={Colors.primary} />
                        <Text style={styles.uploadButtonText}>Take Photo</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter property description"
                  value={newProperty.description}
                  multiline
                  numberOfLines={4}
                  onChangeText={(text) => setNewProperty({ ...newProperty, description: text })}
                />
              </View>

              <View style={{ height: 120 }} />
            </View>
          </ScrollView>
          <View style={[styles.modalButtonsFixed, isAtBottom && styles.modalButtonsStatic]}>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCloseModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              {editingProperty && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteButton]}
                  onPress={handleDeleteProperty}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleAddProperty}
              >
                <Text style={styles.submitButtonText}>{editingProperty ? 'Save' : 'Add Property'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700' as const,
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
  propertyCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  propertyImage: {
    width: '100%',
    height: 200,
  },
  propertyContent: {
    padding: 16,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
    textTransform: 'capitalize',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    marginLeft: 4,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  propertyPrice: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 8,
  },
  propertyDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  editIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalScrollView: {
    flex: 1,
    marginTop: 100,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: '100%',
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtonsFixed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  modalButtonsStatic: {
    position: 'relative' as const,
    shadowOpacity: 0,
    elevation: 0,
    borderTopWidth: 0,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
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
    flexWrap: 'wrap',
  },
  statusChip: {
    flex: 1,
    minWidth: 80,
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
  typePicker: {
    marginBottom: 16,
  },
  typeChip: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  typeChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeChipText: {
    fontSize: 14,
    color: Colors.text,
  },
  typeChipTextSelected: {
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
  filtersModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  filtersModalContent: {
    flex: 1,
    backgroundColor: Colors.card,
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  clearFiltersText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  filtersScrollView: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  filterSectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  filterOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterOptionActive: {
    backgroundColor: Colors.background,
    borderColor: Colors.text,
  },
  filterOptionText: {
    fontSize: 14,
    color: Colors.text,
  },
  filterOptionTextActive: {
    fontWeight: '600' as const,
  },
  rangeInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rangeInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
  },
  rangeSeparator: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  filtersFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
  },
  applyFiltersButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyFiltersButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 24,
    marginBottom: 16,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 8,
  },
  counterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.card,
  },
  counterValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    minWidth: 40,
    textAlign: 'center',
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
  rentalInfoCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  rentalInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rentalInfoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  rentalInfoSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  availabilityPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  availabilityPreviewText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  photoUploadContainer: {
    gap: 12,
  },
  photosList: {
    marginBottom: 8,
  },
  photoItem: {
    position: 'relative',
    marginRight: 12,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 12,
    padding: 4,
  },
  uploadButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
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
  locationPlaceholder: {
    color: Colors.textLight,
  },
  locationSelectorContainer: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginTop: 12,
    maxHeight: 300,
  },
  locationSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  locationSearchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    padding: 0,
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
});
