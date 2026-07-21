import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAuth } from '@/src/auth/auth-context';
import { AppText } from '@/src/components/app-text';
import { ScreenShell } from '@/src/components/screen-shell';
import { colors, radius, spacing } from '@/src/theme/tokens';

/** Preserved onboarding UI; deferred while the Component B learner pages are built. */
export function FirstTimeWelcomeScreen() {
  const palette = colors;
  const { profileName } = useAuth();

  return (
    <ScreenShell centered>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: palette.primarySoft }]}>
          <Ionicons color={palette.textPrimary} name="sparkles" size={42} />
        </View>
        <AppText align="center" variant="title">
          Hi{profileName ? `, ${profileName}` : ''}!
        </AppText>
        <AppText align="center" variant="subtitle">Welcome to MathMingo</AppText>
        <AppText align="center" style={{ color: palette.textSecondary }}>
          Before your first lesson, connect your account to the teacher you will learn with.
        </AppText>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/(onboarding)/teacher-link')}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: palette.primary, borderBottomColor: palette.primaryShadow },
            pressed && styles.buttonPressed,
          ]}>
          <AppText style={[styles.buttonText, { color: palette.primaryForeground }]}>CONTINUE</AppText>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderBottomWidth: 4,
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 60,
    paddingHorizontal: spacing.lg,
  },
  buttonPressed: { borderBottomWidth: 0, transform: [{ translateY: 4 }] },
  buttonText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.4 },
  content: { alignItems: 'center', gap: spacing.lg, maxWidth: 520, width: '100%' },
  iconCircle: {
    alignItems: 'center',
    borderRadius: radius.xl,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
});
