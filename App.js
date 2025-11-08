import 'react-native-gesture-handler';
import React from 'react';
import { SafeAreaView } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { MD3DarkTheme as DefaultTheme, PaperProvider, configureFonts } from 'react-native-paper';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';

export default function App() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const fonts = configureFonts({
    config: {
      fontFamily: 'Inter_400Regular',
      bodyLarge: { fontFamily: 'Inter_400Regular' },
      bodyMedium: { fontFamily: 'Inter_400Regular' },
      bodySmall: { fontFamily: 'Inter_400Regular' },
      titleMedium: { fontFamily: 'Inter_600SemiBold' },
      titleLarge: { fontFamily: 'Inter_700Bold' },
      labelLarge: { fontFamily: 'Inter_600SemiBold' },
    },
  });

  const theme = {
    ...DefaultTheme,
    fonts,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      surface: colors.card,
      onSurface: colors.textPrimary,
    },
    roundness: 12,
  };

  if (!loaded) return null;

  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <AppNavigator />
            <StatusBar style="light" />
          </SafeAreaView>
        </GestureHandlerRootView>
      </AuthProvider>
    </PaperProvider>
  );
}
