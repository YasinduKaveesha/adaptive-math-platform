// The learner header bar: the adventure-charge battery on the left, "Hi, <name>!" on the right.
// Extracted verbatim from learner-home-screen.tsx, which is now one of its two callers (the game
// hub is the other) rather than the sole owner of the markup.
//
// It is deliberately a PRESENTATION component: `displayName` comes in as a prop, and this file
// resolves no name of its own. Home and the session-preparation screen already resolve theirs from
// different sources (`me.learnerProfile.name` vs `learner.displayName`), so a header that picked
// one would silently change the other screen's greeting. Whether those two should agree is a real
// question, but it is not this extraction's to answer, and it is not answered here.
//
// The brand wordmark that used to sit here is gone; the battery reads `level`/`maxLevel` from
// AdventureChargeProvider (the (learner) layout wraps every screen that renders this bar), and the
// "Play Adventure" pill renders from the SAME provider's `pillVisible` -- the tab bar's Play button
// is what sets it, in a different component entirely, which is the whole reason this is a shared
// context rather than a prop each screen would otherwise have to thread through by hand.
//
// The two height constants below are the ones home measures its viewport against
// (`fixedHeaderHeight = compact ? 63 : 88`). They live here, next to the styles that produce them,
// so a change to the padding and a change to the number a caller subtracts cannot drift apart.
// The game hub sizes its grid against the same pair.

import { StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/app-text';
import { useAdventureCharge } from '@/src/features/navigation/adventure-charge-context';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';

/** Rendered height of this bar, per density. Callers that must not scroll subtract it. */
export const LEARNER_HEADER_HEIGHT = 88;
export const LEARNER_HEADER_HEIGHT_COMPACT = 63;

function AdventureBattery({ compact, level, maxLevel }: { compact: boolean; level: number; maxLevel: number }) {
  return (
    <View
      accessibilityLabel={`Adventure charge: ${level} of ${maxLevel} bars`}
      accessibilityRole="progressbar"
      accessibilityValue={{ max: maxLevel, min: 0, now: level }}
      style={[styles.battery, compact && styles.batteryCompact]}>
      <View style={styles.batteryCells}>
        {Array.from({ length: maxLevel }, (_, index) => (
          <View
            key={index}
            style={[styles.batteryCell, index < level ? styles.batteryCellFilled : styles.batteryCellEmpty]}
          />
        ))}
      </View>
      <View style={styles.batteryNub} />
    </View>
  );
}

export function LearnerHeaderBar({
  compact = false,
  displayName,
}: {
  compact?: boolean;
  displayName: string;
}) {
  const { level, maxLevel, pillVisible } = useAdventureCharge();

  return (
    <View style={[styles.headerGreetingSection, compact && styles.sectionCompact]}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <AdventureBattery compact={compact} level={level} maxLevel={maxLevel} />
        </View>

        <View style={styles.pillSlot}>
          {pillVisible ? (
            <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.pill}>
              <AppText style={styles.pillText}>Play Adventure</AppText>
            </View>
          ) : null}
        </View>

        <View style={styles.greeting}>
          <AppText style={[styles.greetingTitle, compact && styles.greetingTitleCompact]}>
            Hi,{' '}
            <AppText style={[styles.greetingName, compact && styles.greetingNameCompact]}>
              {displayName}!
            </AppText>
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  battery: { alignItems: 'center', flexDirection: 'row', height: 32 },
  batteryCell: { borderRadius: 2, flex: 1, height: '100%' },
  batteryCellEmpty: { backgroundColor: colors.surface2 },
  batteryCellFilled: { backgroundColor: colors.accentGreen },
  batteryCells: {
    borderColor: '#F4F4F6',
    borderRadius: radius.sm,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 2,
    height: '100%',
    padding: 2,
    width: 58,
  },
  batteryCompact: { height: 26 },
  batteryNub: { backgroundColor: '#F4F4F6', borderRadius: 1, height: 12, width: 4 },
  brand: { alignItems: 'center', flexDirection: 'row', flexShrink: 1, gap: 3 },
  greeting: { alignItems: 'flex-end', flexShrink: 1, justifyContent: 'center' },
  greetingName: { color: '#26A5FD', fontFamily: typography.fonts.heavy, fontSize: 33.75, lineHeight: 40.5 },
  greetingNameCompact: { fontSize: 28.35, lineHeight: 33.75 },
  greetingTitle: { fontFamily: typography.fonts.body, fontSize: 25, lineHeight: 30 },
  greetingTitleCompact: { fontSize: 21, lineHeight: 25 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  headerGreetingSection: {
    backgroundColor: colors.background,
    flexShrink: 0,
    height: LEARNER_HEADER_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: spacing.smPlus,
    zIndex: 10,
  },
  pill: {
    backgroundColor: '#F4F4F6',
    borderColor: colors.accentGreen,
    borderRadius: radius.pill,
    borderWidth: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  pillSlot: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  pillText: { color: colors.accentGreen, fontSize: 14, fontWeight: '900', letterSpacing: 0.3 },
  sectionCompact: { height: LEARNER_HEADER_HEIGHT_COMPACT },
});
