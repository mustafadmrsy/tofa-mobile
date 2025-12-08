import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ToastProvider } from '@/components/ToastProvider';
import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { requestNotificationPermissions } from '@/services/notificationService';
import { UserRole } from '@/types';

function RootLayoutNav() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { colorScheme, isThemeLoaded } = useTheme();
  const colors = Colors[colorScheme];
  const segments = useSegments();
  const router = useRouter();

  // Request notification permissions on mount
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  useEffect(() => {
    if (isLoading || !isThemeLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Kullanıcı giriş yapmamış, login'e yönlendir
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Kullanıcı giriş yapmış, role'e göre yönlendir
      if (user?.role === UserRole.SUPER_ADMIN) {
        router.replace('/(admin)/teams');
      } else if (user?.role === UserRole.TEAM_MANAGER) {
        router.replace('/(teamManager)/manageTasks');
      } else {
        router.replace('/(user)/tasks');
      }
    }
  }, [isAuthenticated, isLoading, user, isThemeLoaded]);

  if (isLoading || !isThemeLoaded) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="(teamManager)" options={{ headerShown: false }} />
        <Stack.Screen name="(user)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ToastProvider />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}
