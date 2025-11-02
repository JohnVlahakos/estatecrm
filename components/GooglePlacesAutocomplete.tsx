import React from 'react';
import { View, StyleSheet } from 'react-native';
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
  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        placeholder={placeholder}
        onPress={(data, details = null) => {
          const placeName = data.structured_formatting?.main_text || data.description;
          onPlaceSelected(placeName);
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
        fetchDetails={true}
        enablePoweredByContainer={false}
        debounce={300}
        predefinedPlaces={[]}
        predefinedPlacesAlwaysVisible={false}
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
});
