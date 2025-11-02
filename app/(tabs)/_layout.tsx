import { Tabs, router } from "expo-router";
import { Home, Users, Building2, Calendar, Settings, TrendingUp } from "lucide-react-native";
import React from "react";
import { TouchableOpacity, Image, Text, StyleSheet } from "react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

function ProfileIcon() {
  const { currentUser } = useAuth();

  const handlePress = () => {
    router.push('/(tabs)/settings');
  };

  return (
    <TouchableOpacity 
      onPress={handlePress}
      style={styles.profileButton}
    >
      {currentUser?.avatarUrl ? (
        <Image 
          source={{ uri: currentUser.avatarUrl }} 
          style={styles.profileImage}
        />
      ) : (
        <Text style={styles.profileInitial}>
          {currentUser?.name.charAt(0).toUpperCase() || 'U'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.card,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: Colors.text,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
        },
        headerRight: () => <ProfileIcon />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          headerRight: () => <ProfileIcon />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: "Clients",
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
          headerRight: () => <ProfileIcon />,
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: "Properties",
          tabBarIcon: ({ color }) => <Building2 size={24} color={color} />,
          headerRight: () => <ProfileIcon />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Appointments",
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
          headerRight: () => <ProfileIcon />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: "Matches",
          tabBarIcon: ({ color }) => <TrendingUp size={24} color={color} />,
          headerRight: () => <ProfileIcon />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
          headerRight: () => <ProfileIcon />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.card,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileInitial: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
