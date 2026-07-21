import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAuth } from '@/src/auth/auth-context';
import { AppText } from '@/src/components/app-text';
import { ScreenShell } from '@/src/components/screen-shell';
import { colors, radius, spacing } from '@/src/theme/tokens';

const steps = [
  'Ask your teacher to show their MathMingo QR code.',
  'Scan that QR code with this app.',
  'After the server confirms the teacher, your first lesson will unlock.',
];

/** Preserved teacher-link UI; QR scanning awaits an approved backend contract. */
export function TeacherLinkInstructionsScreen() {
  const palette = colors;
  const { continueToComponentBPreview } = useAuth();

  return (
    <ScreenShell centered>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: palette.primarySoft }]}>
          <Ionicons color={palette.textPrimary} name="qr-code-outline" size={48} />
        </View>
        <AppText align="center" variant="title">Connect your teacher</AppText>
        <AppText align="center" style={{ color: palette.textSecondary }}>
          This one-time step makes sure you attend lessons with the correct teacher.
        </AppText>

        <View style={[styles.stepsCard, { backgroundColor: palette.surface1, borderColor: palette.border }]}> 
          {steps.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <View style={[styles.stepNumber, { backgroundColor: palette.primary }]}>
                <AppText style={[styles.stepNumberText, { color: palette.primaryForeground }]}> 
                  {index + 1}
                </AppText>
              </View>
              <AppText style={styles.stepText}>{step}</AppText>
            </View>
          ))}
        </View>

        <View style={[styles.pendingCard, { backgroundColor: palette.primarySoft }]}>
          <Ionicons color={palette.textPrimary} name="shield-checkmark-outline" size={24} />
          <AppText style={styles.pendingText}>
            Teacher QR linking will be connected when the secure backend API is available. Continue
            now to preview Component B during frontend development.
          </AppText>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={continueToComponentBPreview}
          style={({ pressed }) => [
            styles.continueButton,
            { backgroundColor: palette.primary, borderBottomColor: palette.primaryShadow },
            pressed && styles.buttonPressed,
          ]}>
          <AppText style={[styles.continueText, { color: palette.primaryForeground }]}>CONTINUE</AppText>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', gap: spacing.lg, maxWidth: 560, width: '100%' },
  iconCircle: {
    alignItems: 'center',
    borderRadius: radius.xl,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  pendingCard: {
    alignItems: 'flex-start',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.smPlus,
    padding: spacing.md,
    width: '100%',
  },
  pendingText: { flex: 1, fontSize: 15 },
  buttonPressed: { borderBottomWidth: 0, transform: [{ translateY: 4 }] },
  continueButton: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderBottomWidth: 4,
    justifyContent: 'center',
    minHeight: 60,
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  continueText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.4 },
  stepNumber: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  stepNumberText: { fontSize: 15, fontWeight: '800' },
  stepRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.smPlus },
  stepText: { flex: 1 },
  stepsCard: {
    borderRadius: radius.lg,
    borderWidth: 2,
    gap: spacing.lg,
    padding: spacing.lg,
    width: '100%',
  },
});
