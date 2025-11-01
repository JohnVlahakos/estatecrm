import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CRMProvider } from "@/contexts/CRMContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { registerForPushNotificationsAsync } from "@/utils/notifications";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'clients' || segments[0] === 'properties' || segments[0] === 'appointments' || segments[0] === 'admin-users' || segments[0] === 'admin-subscriptions' || segments[0] === 'subscription' || segments[0] === 'admin-cities';

    console.log('Auth state:', { isAuthenticated, isLoading, segments, inAuthGroup });

    if (!isAuthenticated && inAuthGroup) {
      console.log('Redirecting to login...');
      router.replace('/login');
    } else if (isAuthenticated && !inAuthGroup) {
      console.log('Redirecting to tabs...');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isLoading, router]);

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="admin-users" options={{ headerShown: false }} />
      <Stack.Screen name="admin-subscriptions" options={{ headerShown: false }} />
      <Stack.Screen name="admin-cities" options={{ headerShown: false }} />
      <Stack.Screen name="subscription" options={{ headerShown: false }} />
      <Stack.Screen name="clients/[id]" options={{ headerShown: true, title: "Client Details" }} />
      <Stack.Screen name="properties/[id]" options={{ headerShown: true, title: "Property Details" }} />
      <Stack.Screen name="appointments/[id]" options={{ headerShown: true, title: "Appointment Details" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
    registerForPushNotificationsAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SubscriptionProvider>
          <SettingsProvider>
            <CRMProvider>
              <GestureHandlerRootView>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </CRMProvider>
          </SettingsProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
