import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CRMProvider } from "@/contexts/CRMContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { NotificationBadgeProvider } from "@/contexts/NotificationBadgeContext";
import { registerForPushNotificationsAsync } from "@/utils/notifications";
import * as Notifications from "expo-notifications";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      console.log('Still loading auth state...');
      return;
    }

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'admin-users' || segments[0] === 'admin-subscriptions' || segments[0] === 'subscription' || segments[0] === 'admin-cities';
    const isLoginOrRegister = segments[0] === 'login' || segments[0] === 'register';

    console.log('Navigation guard check:', { 
      isAuthenticated, 
      isLoading, 
      currentSegment: segments[0], 
      inAuthGroup, 
      isLoginOrRegister 
    });

    if (!isAuthenticated && inAuthGroup) {
      console.log('Not authenticated in protected route, redirecting to login...');
      router.replace('/login');
    } else if (isAuthenticated && (isLoginOrRegister || !segments[0])) {
      console.log('Authenticated, redirecting to tabs...');
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
      <Stack.Screen 
        name="admin-cities" 
        options={{ 
          presentation: 'modal',
          headerShown: true,
          title: 'Manage Cities',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen name="subscription" options={{ headerShown: false }} />
      <Stack.Screen name="clients/[id]" options={{ headerShown: true, title: "Client Details" }} />
      <Stack.Screen name="properties/[id]" options={{ headerShown: true, title: "Property Details" }} />
      <Stack.Screen name="appointments/[id]" options={{ headerShown: true, title: "Appointment Details" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    SplashScreen.hideAsync();
    registerForPushNotificationsAsync();

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);

      if (data.type === 'new_match') {
        router.push('/(tabs)/matches');
      } else if (data.type === 'appointment') {
        router.push('/(tabs)/appointments');
      }
    });

    return () => subscription.remove();
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SubscriptionProvider>
          <SettingsProvider>
            <NotificationBadgeProvider>
              <CRMProvider>
                <GestureHandlerRootView>
                  <RootLayoutNav />
                </GestureHandlerRootView>
              </CRMProvider>
            </NotificationBadgeProvider>
          </SettingsProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
