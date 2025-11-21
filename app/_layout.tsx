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
  const { isAuthenticated, isLoading, currentUser } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log('\n🔄 ===== RootLayoutNav useEffect triggered =====');
    console.log('📊 Auth State:', { 
      isAuthenticated, 
      isLoading, 
      hasUser: !!currentUser, 
      userEmail: currentUser?.email,
      userStatus: currentUser?.status,
      userRole: currentUser?.role
    });
    console.log('📍 Current segments:', segments);
    
    if (isLoading) {
      console.log('⏳ Still loading auth state, waiting...');
      console.log('===== End =====\n');
      return;
    }

    const currentSegment = segments[0];
    const inAuthGroup = currentSegment === '(tabs)' || currentSegment === 'admin-users' || currentSegment === 'admin-subscriptions' || currentSegment === 'subscription' || currentSegment === 'admin-cities';
    const isLoginOrRegister = currentSegment === 'login' || currentSegment === 'register';

    console.log('🛣️  Navigation guard check:', { 
      isAuthenticated, 
      currentSegment, 
      inAuthGroup, 
      isLoginOrRegister,
      segmentsLength: segments.length
    });

    if (isAuthenticated) {
      if (isLoginOrRegister || !currentSegment) {
        console.log('✅ ✅ ✅ User authenticated, REDIRECTING TO DASHBOARD NOW...');
        console.log('🚀 Calling router.replace("/(tabs)")');
        try {
          router.replace('/(tabs)');
          console.log('✅ router.replace called successfully');
        } catch (error) {
          console.error('❌ router.replace failed:', error);
        }
        console.log('===== End =====\n');
        return;
      }
      console.log('✔️  User authenticated and already in app');
      console.log('===== End =====\n');
    } else {
      if (inAuthGroup || !currentSegment) {
        console.log('❌ Not authenticated, redirecting to login...');
        console.log('===== End =====\n');
        router.replace('/login');
        return;
      }
      console.log('✔️  User on login/register page');
      console.log('===== End =====\n');
    }
  }, [isAuthenticated, isLoading, segments, router, currentUser]);

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
