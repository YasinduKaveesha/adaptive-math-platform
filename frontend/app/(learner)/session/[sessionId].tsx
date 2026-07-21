import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/app-text';
import { ScreenShell } from '@/src/components/screen-shell';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';

/** Thin route boundary only; the full Learning Session screen is the next page. */
export default function LearningSessionDestinationRoute() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const hasOpaqueSession = typeof sessionId === 'string' && sessionId.length > 0;

  return (
    <ScreenShell centered>
      <View style={styles.content}>
        <View style={styles.iconCircle}><Ionicons color={colors.primary} name="book-outline" size={44} /></View>
        <AppText align="center" variant="title">Learning session</AppText>
        <AppText align="center" style={styles.message}>
          {hasOpaqueSession ? 'Your session is ready. The question experience comes next.' : 'Return Home so MathMingo can prepare your session safely.'}
        </AppText>
        <Pressable accessibilityRole="button" onPress={() => router.replace('/(learner)/home')} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <AppText style={styles.buttonText}>BACK TO HOME</AppText>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: colors.surface1, borderBottomColor: colors.borderStrong, borderBottomWidth: 3, borderColor: colors.border, borderRadius: radius.md, borderWidth: 2, justifyContent: 'center', minHeight: 56, paddingHorizontal: spacing.lg },
  buttonText: { fontFamily: typography.fonts.bold, fontSize: 15, letterSpacing: typography.letterSpacing.button },
  content: { alignItems: 'center', gap: spacing.lg, maxWidth: 520, width: '100%' },
  iconCircle: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.xl, height: 88, justifyContent: 'center', width: 88 },
  message: { color: colors.textSecondary },
  pressed: { opacity: 0.72 },
});
