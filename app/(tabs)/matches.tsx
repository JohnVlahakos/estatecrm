import React, { useState, useMemo, useRef } from 'react';
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
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { TrendingUp, User, DollarSign, MapPin, Home, X } from 'lucide-react-native';
import type { Property, Client } from '@/types';

interface PropertyMatch {
  property: Property;
  buyers: {
    client: Client;
    matchScore: number;
  }[];
}

export default function MatchesScreen() {
  const { properties, clients, calculateMatchScore, isLoading, markMatchAsViewed, isMatchViewed } = useCRM();
  const { clearMatchesBadge } = useNotificationBadges();
  const router = useRouter();
  const [expandedPropertyId, setExpandedPropertyId] = useState<string | null>(null);
  const [excludedMatches, setExcludedMatches] = useState<Set<string>>(new Set());

  const propertyMatches = useMemo(() => {
    const buyers = clients.filter(c => c.category === 'buyer');
    
    const matches: PropertyMatch[] = properties.map(property => {
      const matchedBuyers = buyers
        .map(buyer => ({
          client: buyer,
          matchScore: calculateMatchScore(buyer, property),
        }))
        .filter(m => {
          const matchKey = `${m.client.id}-${property.id}`;
          return m.matchScore > 30 && !excludedMatches.has(matchKey);
        })
        .sort((a, b) => b.matchScore - a.matchScore);

      return {
        property,
        buyers: matchedBuyers,
      };
    });

    return matches.sort((a, b) => b.buyers.length - a.buyers.length);
  }, [properties, clients, calculateMatchScore, excludedMatches]);

  const getNewMatchesCount = (propertyId: string, buyers: { client: Client; matchScore: number }[]) => {
    return buyers.filter(buyer => !isMatchViewed(propertyId, buyer.client.id)).length;
  };

  const totalMatches = useMemo(() => {
    return propertyMatches.reduce((sum, match) => sum + match.buyers.length, 0);
  }, [propertyMatches]);

  const hasClearedBadgeRef = useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      if (!hasClearedBadgeRef.current) {
        clearMatchesBadge(totalMatches);
        hasClearedBadgeRef.current = true;
      }
      
      return () => {
        hasClearedBadgeRef.current = false;
      };
    }, [clearMatchesBadge, totalMatches])
  );

  const toggleExpand = (propertyId: string) => {
    const newExpandedId = expandedPropertyId === propertyId ? null : propertyId;
    setExpandedPropertyId(newExpandedId);
    
    if (newExpandedId) {
      const match = propertyMatches.find(m => m.property.id === propertyId);
      if (match) {
        match.buyers.forEach(buyer => {
          if (!isMatchViewed(propertyId, buyer.client.id)) {
            markMatchAsViewed(propertyId, buyer.client.id);
          }
        });
      }
    }
  };

  const handleRemoveMatch = (clientId: string, propertyId: string) => {
    const matchKey = `${clientId}-${propertyId}`;
    setExcludedMatches(prev => new Set(prev).add(matchKey));
  };

  const handleBuyerPress = (clientId: string) => {
    router.push({
      pathname: '/(tabs)/clients',
      params: { clientId }
    });
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
        const newMatchesCount = getNewMatchesCount(match.property.id, match.buyers);
        const hasNewMatches = newMatchesCount > 0;
        
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
                  {hasNewMatches && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>{newMatchesCount}</Text>
                    </View>
                  )}
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
                
                {match.buyers.map((buyer) => {
                  const isNew = !isMatchViewed(match.property.id, buyer.client.id);
                  
                  return (
                  <View key={buyer.client.id} style={styles.buyerCard}>
                    <TouchableOpacity
                      style={styles.buyerInfo}
                      onPress={() => handleBuyerPress(buyer.client.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.buyerIconContainer}>
                        <User size={16} color={Colors.primary} />
                      </View>
                      <View style={styles.buyerDetails}>
                        <Text style={[styles.buyerName, isNew && styles.newBuyerText]}>{buyer.client.name}</Text>
                        <Text style={styles.buyerContact}>{buyer.client.phone}</Text>
                        {buyer.client.budgetMax && (
                          <Text style={styles.buyerBudget}>
                            Budget: €{(buyer.client.budgetMin || 0).toLocaleString()} - €{buyer.client.budgetMax.toLocaleString()}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                    
                    <View style={styles.buyerActions}>
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
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveMatch(buyer.client.id, match.property.id)}
                        activeOpacity={0.7}
                      >
                        <X size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  );
                })}
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
    minWidth: 0,
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
  buyerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeButton: {
    padding: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700' as const,
  },
  newBuyerText: {
    color: '#EF4444',
  },
});
