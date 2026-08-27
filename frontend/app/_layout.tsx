import {
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/src/auth/auth-context';
import { colors } from '@/src/theme/tokens';

void SplashScreen.preventAutoHideAsync();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface1,
    text: colors.textPrimary,
    border: colors.border,
  },
};

function RootNavigator() {
  const { status } = useAuth();
  const authorized = status === 'authorized';
  const learnerAccess = authorized || status === 'preview';
  const onboarding = status === 'onboarding';

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={!learnerAccess && !onboarding}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={onboarding}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected guard={learnerAccess}>
          <Stack.Screen name="(learner)" />
        </Stack.Protected>
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) return null;

  return (
    // Required by `react-native-gesture-handler` (used by `value-token-row.tsx`'s NP-04 reorder
    // drag, 10a) at the root of the app, on every platform including web -- without it, gestures
    // fail to register touches at all. Missing since 10a shipped; added 2026-08-26 once the owner
    // found NP-04's drag genuinely did not respond in the browser. `style={{ flex: 1 }}` so this
    // wrapper fills the screen rather than sizing to its own (empty) content.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
