import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/app-text';
import { resultsView, type SessionProgress } from '@/src/features/session/live-session-logic';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';

// FE-3f — the end of a session. Counts, and a way home. That is the entire surface.
//
// There is no score, no percentage, no stars, no streak, no per-skill breakdown, no mastery figure
// and no "you got 3 right". None of that is missing; all of it is excluded. The client does observe
// every `response_matched` as a session runs, and it must never accumulate them into a score or any
// other derived summary: the backend deliberately withholds an evaluative summary from the
// child-facing surface, so a client that assembled one out of responses it happened to see would be
// synthesising precisely the thing that was withheld — a governance violation wearing the costume of
// a helpful UI feature. A child who got everything wrong and a child who got everything right see
// this identical screen, by design. The full reasoning, and the test that locks it, live on
// `resultsView` in live-session-logic.ts.
//
// The counts come from the completion response the session screen already holds. `GET /summary` is
// not called: it would add a round trip for numbers already in hand, and would import that
// endpoint's abandoned/expired/technical_failed-all-report-as-"active" behaviour
// (session_completion.py:550) for no benefit.
//
// Results are not deep-linkable and do not survive a reload. That is deliberate, not a gap — the app
// keeps no learner-facing record of performance, so there is nothing to return to. A child who
// reopens the app lands on preparation and starts fresh.

type SessionResultsScreenProps = {
  progress: SessionProgress;
  onExit: () => void;
};

export function SessionResultsScreen({ onExit, progress }: SessionResultsScreenProps) {
  const view = resultsView(progress);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.canvas}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Ionicons color={colors.accentGreen} name="ribbon-outline" size={52} />
          </View>
          <AppText align="center" variant="title">
            {view.headline}
          </AppText>
          <AppText align="center" style={styles.detail}>
            {view.detail}
          </AppText>
          <Pressable
            accessibilityRole="button"
            onPress={onExit}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <AppText style={styles.buttonText}>BACK TO HOME</AppText>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderColor: colors.surface1,
    borderRadius: radius.md,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: 62,
    paddingHorizontal: spacing.lg,
  },
  buttonText: {
    color: colors.primaryForeground,
    fontFamily: typography.fonts.bold,
    fontSize: 17,
    letterSpacing: typography.letterSpacing.button,
  },
  canvas: {
    alignSelf: 'center',
    backgroundColor: colors.background,
    flex: 1,
    maxWidth: 500,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  detail: { color: colors.textSecondary },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: '#e9f8f1',
    borderRadius: radius.xl,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
  pressed: { opacity: 0.85 },
  safeArea: { backgroundColor: colors.background, flex: 1 },
});
