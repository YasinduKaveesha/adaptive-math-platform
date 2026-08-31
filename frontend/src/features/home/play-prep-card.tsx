import { useEffect, useMemo, useRef } from 'react';

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/app-text';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';

// Purpose-made prep-card artwork: a garden scene framing a cream parchment panel, at the exact
// portrait aspect ratio (941/1672) Home's "Ready to Play" path panel already uses.
const startGameArtwork = require('../../../assets/images/StartGame.png');
const CARD_ASPECT_RATIO = 941 / 1672;
// Fraction of the card's height, from the top, before the artwork's own cream panel begins --
// content starts below this so it never sits on top of the sky/cloud band.
const ARTWORK_PANEL_TOP = 0.155;

// The seven frozen skill names Component C's own mastery vocabulary uses
// (backend/app/application/live_engine_c/mastery_fixture.py). Shown here as a warm-up
// "calibration" the child watches while the real first task loads in the background -- the bar
// values are a staged animation, NOT a per-child mastery report (the backend exposes no such
// figure on any Component C response, by design).
const SKILL_ROWS = [
  { key: 'counting', label: 'Counting', color: colors.primary, target: 62 },
  { key: 'number_sense', label: 'Number Sense', color: colors.accentBlue, target: 48 },
  { key: 'place_value', label: 'Place Value', color: colors.accentGreen, target: 55 },
  { key: 'addition', label: 'Addition', color: '#ffb51f', target: 71 },
  { key: 'subtraction', label: 'Subtraction', color: '#9a64df', target: 44 },
  { key: 'multiplication', label: 'Multiplication', color: colors.accentBlue, target: 37 },
  { key: 'division', label: 'Division', color: colors.accentGreen, target: 29 },
] as const;

const ROW_ANIMATION_MS = 780;
const ROW_STAGGER_MS = 110;

type PlayPrepCardProps = {
  ready: boolean;
  onStart: () => void;
  onDismiss: () => void;
};

/**
 * The blurred-backdrop preparation card shown while a full-charge Play press loads Component C's
 * first task. Rendered once, globally, by AdventureChargeProvider. Frames itself like Home's
 * "Ready to Play" card (same artwork, aspect ratio, rounded border), sweeps the seven skill bars
 * top-to-bottom as a calibration cue, then hands off to the game via the hero-styled Start Game
 * button once the background prefetch has settled.
 */
export function PlayPrepCard({ ready, onStart, onDismiss }: PlayPrepCardProps) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const rowProgress = useRef(SKILL_ROWS.map(() => new Animated.Value(0))).current;
  const cardIn = useRef(new Animated.Value(0)).current;

  // Card geometry: keep the exact portrait aspect ratio of Home's path panel, sized to whatever
  // fits between the safe-area insets, then capped so it never dominates a tall screen.
  const availableHeight = height - insets.top - insets.bottom - spacing.xl * 2;
  const availableWidth = Math.min(width - spacing.lg * 2, 380);
  let cardHeight = Math.min(availableHeight, 600);
  let cardWidth = cardHeight * CARD_ASPECT_RATIO;
  if (cardWidth > availableWidth) {
    cardWidth = availableWidth;
    cardHeight = cardWidth / CARD_ASPECT_RATIO;
  }

  useEffect(() => {
    Animated.timing(cardIn, {
      duration: 240,
      easing: Easing.out(Easing.quad),
      toValue: 1,
      useNativeDriver: true,
    }).start();

    Animated.stagger(
      ROW_STAGGER_MS,
      rowProgress.map((value) =>
        Animated.timing(value, {
          duration: ROW_ANIMATION_MS,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: false,
        }),
      ),
    ).start();
  }, [cardIn, rowProgress]);

  const cardStyle = useMemo(
    () => ({
      height: cardHeight,
      opacity: cardIn,
      transform: [
        { scale: cardIn.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
      ],
      width: cardWidth,
    }),
    [cardHeight, cardIn, cardWidth],
  );

  return (
    <View style={styles.overlay}>
      <BlurView intensity={40} style={StyleSheet.absoluteFill} tint="light" />
      <View style={styles.scrim} />

      <Animated.View style={[styles.card, cardStyle]}>
        <Image
          accessibilityLabel="A sunny garden framing your adventure"
          contentFit="cover"
          source={startGameArtwork}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.cardInner, { paddingTop: cardHeight * ARTWORK_PANEL_TOP + spacing.sm }]}>
          <Pressable
            accessibilityLabel="Close"
            accessibilityRole="button"
            hitSlop={10}
            onPress={onDismiss}
            style={styles.closeButton}>
            <Ionicons color={colors.textSecondary} name="close" size={20} />
          </Pressable>

          <View style={styles.heading}>
            <Ionicons color={colors.accentGreen} name="map" size={22} />
            <AppText style={styles.headingText}>Ready to Play</AppText>
          </View>
          <AppText style={styles.subheading}>Warming up your skills…</AppText>

          <View style={styles.rows}>
            {SKILL_ROWS.map((skill, index) => (
              <View key={skill.key} style={styles.row}>
                <AppText numberOfLines={1} style={styles.rowLabel}>
                  {index + 1}. {skill.label}
                </AppText>
                <View style={styles.track}>
                  <Animated.View
                    style={[
                      styles.trackFill,
                      {
                        backgroundColor: skill.color,
                        width: rowProgress[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', `${skill.target}%`],
                        }),
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>

          <Pressable
            accessibilityHint="Starts your prepared math game"
            accessibilityRole="button"
            accessibilityState={{ disabled: !ready }}
            disabled={!ready}
            onPress={onStart}
            style={({ pressed }) => [
              styles.startButton,
              !ready && styles.startButtonDisabled,
              pressed && styles.startButtonPressed,
            ]}>
            {ready ? (
              <>
                <AppText style={styles.startButtonText}>Start Game</AppText>
                <Ionicons color={colors.primaryForeground} name="chevron-forward" size={20} />
              </>
            ) : (
              <>
                <ActivityIndicator color={colors.primaryForeground} size="small" />
                <AppText style={styles.startButtonText}>Preparing…</AppText>
              </>
            )}
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    elevation: 8,
    overflow: 'hidden',
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
  },
  // The artwork itself paints the cream card panel this content sits on -- no white tint needed
  // here, only the padding (paddingTop is overridden inline to clear the panel's own top edge).
  cardInner: {
    flex: 1,
    gap: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  closeButton: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.xs,
    top: spacing.xs,
    width: 28,
    zIndex: 2,
  },
  heading: { alignItems: 'center', flexDirection: 'row', gap: 6, justifyContent: 'center' },
  headingText: {
    fontFamily: typography.fonts.heavy,
    fontSize: 18,
    lineHeight: 22.5,
  },
  overlay: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  // Label on the left, bar pinned to the right edge of the row -- not butted up against the
  // label -- via space-between rather than a gap.
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  // No fixed width: `row`'s space-between already reserves the track's own 120px on the right,
  // so the label is free to size to its full text ("6. Multiplication" etc.) without truncating.
  rowLabel: {
    fontFamily: typography.fonts.bold,
    fontSize: 14,
    lineHeight: 18,
  },
  // The seven rows as one block, vertically centered in the space between the subheading and
  // the Start Game button.
  rows: { flex: 1, gap: spacing.mdPlus, justifyContent: 'center' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(22,22,28,0.3)' },
  startButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.surface1,
    borderRadius: 14.88,
    borderWidth: 2,
    elevation: 4,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    minHeight: 49.6,
    paddingHorizontal: 14.88,
    shadowColor: colors.primaryShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  startButtonDisabled: { opacity: 0.6 },
  startButtonPressed: { borderBottomWidth: 0, transform: [{ translateY: 3 }] },
  startButtonText: {
    color: colors.primaryForeground,
    fontFamily: typography.fonts.bold,
    fontSize: 13.64,
    lineHeight: 22.32,
    textAlign: 'center',
  },
  subheading: {
    color: colors.textSecondary,
    fontFamily: typography.fonts.body,
    fontSize: 12,
    lineHeight: 16,
    marginTop: -2,
    textAlign: 'center',
  },
  trackFill: { borderRadius: radius.pill, height: '100%' },
  track: {
    backgroundColor: colors.surface3,
    borderRadius: radius.pill,
    height: 16,
    overflow: 'hidden',
    width: 120,
  },
});
