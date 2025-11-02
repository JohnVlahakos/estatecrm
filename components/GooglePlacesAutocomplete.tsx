import React, { useRef, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Colors from '@/constants/colors';

interface GooglePlacesAutocompleteProps {
  placeholder: string;
  onPlaceSelected: (place: string) => void;
  defaultValue?: string;
  apiKey: string;
}

export default function CityAutocomplete({ 
  placeholder, 
  onPlaceSelected, 
  defaultValue,
  apiKey 
}: GooglePlacesAutocompleteProps) {
  const ref = useRef<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <GooglePlacesAutocomplete
        ref={ref}
        placeholder={placeholder}
        onPress={(data, details = null) => {
          console.log('Place selected:', data);
          const placeName = data.structured_formatting?.main_text || data.description;
          onPlaceSelected(placeName);
          if (ref.current) {
            ref.current.setAddressText('');
          }
        }}
        query={{
          key: apiKey,
          language: 'el',
          types: '(cities)',
          components: 'country:gr',
        }}
        textInputProps={{
          placeholderTextColor: Colors.textLight,
          defaultValue: defaultValue,
          onChangeText: (text) => {
            console.log('Text changed:', text);
            setError(null);
            if (text.length >= 2) {
              setIsSearching(true);
            } else {
              setIsSearching(false);
            }
          },
        }}
        styles={{
          container: styles.autocompleteContainer,
          textInputContainer: styles.textInputContainer,
          textInput: styles.textInput,
          listView: styles.listView,
          row: styles.row,
          description: styles.description,
          poweredContainer: styles.poweredContainer,
          powered: styles.powered,
        }}
        fetchDetails={false}
        enablePoweredByContainer={false}
        debounce={400}
        minLength={2}
        keepResultsAfterBlur={false}
        onFail={(error) => {
          console.error('GooglePlacesAutocomplete error:', error);
          setError('Failed to fetch suggestions. Check your API key.');
          setIsSearching(false);
        }}
        onNotFound={() => {
          console.log('No results found');
          setIsSearching(false);
        }}
        listEmptyComponent={() => {
          if (isSearching) {
            return (
              <View style={styles.emptyStateContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.emptyStateText}>Αναζήτηση...</Text>
              </View>
            );
          }
          return null;
        }}
        predefinedPlaces={[]}
        requestUrl={{
          useOnPlatform: 'all',
          url: 'https://maps.googleapis.com/maps/api/place/autocomplete/json',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  autocompleteContainer: {
    flex: 0,
  },
  textInputContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    height: 56,
  },
  listView: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 10000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  row: {
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  description: {
    fontSize: 15,
    color: Colors.text,
  },
  poweredContainer: {
    display: 'none',
  },
  powered: {
    display: 'none',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  emptyStateContainer: {
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  emptyStateText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
