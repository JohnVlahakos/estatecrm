import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useCRM } from '@/contexts/CRMContext';
import { useNotificationBadges } from '@/contexts/NotificationBadgeContext';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '@/constants/colors';
import { TrendingUp, User, DollarSign, MapPin, Home } from 'lucide-react-native';
import type { Property, Client } from '@/types';

interface PropertyMatch {
  property: Property;
  buyers: Array<{
    client: Client;
    matchScore: number;
  }>;
}

export default function MatchesScreen() {
  const { properties, clients, calculateMatchScore, isLoading } = useCRM();
  const { clearMatchesBadge } = useNotificationBadges();
  const [expandedPropertyId, setExpandedPropertyId] = useState<string | null>(null);

  const propertyMatches = useMemo(() => {
    const buyers = clients.filter(c => c.category === 'buyer');
    
    const matches: PropertyMatch[] = properties.map(property => {
      const matchedBuyers = buyers
        .map(buyer => ({
          client: buyer,
          matchScore: calculateMatchScore(buyer, property),
        }))
        .filter(m => m.matchScore > 30)
        .sort((a, b) => b.matchScore - a.matchScore);

      return {
        property,
        buyers: matchedBuyers,
      };
    });

    return matches.sort((a, b) => b.buyers.length - a.buyers.length);
  }, [properties, clients, calculateMatchScore]);

  const totalMatches = useMemo(() => {
    return propertyMatches.reduce((sum, match) => sum + match.buyers.length, 0);
  }, [propertyMatches]);

  useFocusEffect(
    React.useCallback(() => {
      clearMatchesBadge(totalMatches);
    }, [clearMatchesBadge, totalMatches])
  );

  const toggleExpand = (propertyId: string) => {
    setExpandedPropertyId(expandedPropertyId === propertyId ? null : propertyId);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const getPropertyTypeIcon = (type: string) => {
    return <Home size={18} color={Colors.primary} />;
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Property Matches</Text>
        <Text style={styles.headerSubtitle}>
          {propertyMatches.length} properties • {clients.filter(c => c.category === 'buyer').length} buyers
        </Text>
      </View>

      {propertyMatches.map((match) => {
        const isExpanded = expandedPropertyId === match.property.id;
        
        return (
          <View key={match.property.id} style={styles.card}>
            <TouchableOpacity
              style={styles.propertyHeader}
              onPress={() => toggleExpand(match.property.id)}
              activeOpacity={0.7}
            >
              <View style={styles.propertyInfo}>
                <View style={styles.propertyTitleRow}>
                  {getPropertyTypeIcon(match.property.type)}
                  <Text style={styles.propertyTitle} numberOfLines={1}>
                    {match.property.title}
                  </Text>
                </View>
                
                <View style={styles.propertyDetails}>
                  <View style={styles.detailRow}>
                    <MapPin size={14} color={Colors.textLight} />
                    <Text style={styles.detailText} numberOfLines={1}>
                      {match.property.location}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <DollarSign size={14} color={Colors.textLight} />
                    <Text style={styles.detailText}>
                      €{match.property.price.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.matchBadge}>
                <TrendingUp size={18} color={Colors.primary} />
                <Text style={styles.matchCount}>
                  {match.buyers.length}
                </Text>
                <Text style={styles.matchLabel}>matches</Text>
              </View>
            </TouchableOpacity>

            {isExpanded && match.buyers.length > 0 && (
              <View style={styles.buyersContainer}>
                <View style={styles.divider} />
                <Text style={styles.buyersHeader}>Matched Buyers</Text>
                
                {match.buyers.map((buyer, index) => (
                  <View key={buyer.client.id} style={styles.buyerCard}>
                    <View style={styles.buyerInfo}>
                      <View style={styles.buyerIconContainer}>
                        <User size={16} color={Colors.primary} />
                      </View>
                      <View style={styles.buyerDetails}>
                        <Text style={styles.buyerName}>{buyer.client.name}</Text>
                        <Text style={styles.buyerContact}>{buyer.client.phone}</Text>
                        {buyer.client.budgetMax && (
                          <Text style={styles.buyerBudget}>
                            Budget: €{(buyer.client.budgetMin || 0).toLocaleString()} - €{buyer.client.budgetMax.toLocaleString()}
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    <View style={[
                      styles.scoreContainer,
                      { backgroundColor: getMatchColor(buyer.matchScore) + '20' }
                    ]}>
                      <Text style={[
                        styles.scoreText,
                        { color: getMatchColor(buyer.matchScore) }
                      ]}>
                        {buyer.matchScore}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {isExpanded && match.buyers.length === 0 && (
              <View style={styles.noBuyersContainer}>
                <View style={styles.divider} />
                <Text style={styles.noBuyersText}>No matching buyers found</Text>
              </View>
            )}
          </View>
        );
      })}

      {propertyMatches.length === 0 && (
        <View style={styles.emptyContainer}>
          <TrendingUp size={48} color={Colors.textLight} />
          <Text style={styles.emptyText}>No properties available</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
  },
  card: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  propertyHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  propertyInfo: {
    flex: 1,
    marginRight: 12,
  },
  propertyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  propertyDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: Colors.textLight,
    flex: 1,
  },
  matchBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 80,
  },
  matchCount: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginTop: 4,
  },
  matchLabel: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 16,
  },
  buyersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  buyersHeader: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  buyerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  buyerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  buyerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  buyerDetails: {
    flex: 1,
  },
  buyerName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  buyerContact: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 2,
  },
  buyerBudget: {
    fontSize: 11,
    color: Colors.textLight,
  },
  scoreContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  noBuyersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  noBuyersText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    paddingVertical: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textLight,
    marginTop: 16,
  },
});
