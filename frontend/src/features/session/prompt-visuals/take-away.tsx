import { StyleSheet, View } from 'react-native';

import type { TakeAwayVisual } from '@/src/features/session/prompt-visuals/types';
import { colors, radius, spacing } from '@/src/theme/tokens';

// B-SUB01 — `total` objects, with `removed` of them shown as taken away (faded and crossed) so the
// remainder stays countable.
//
// THE REMAINDER IS NEVER SHOWN AS A COUNT. Counting what is left is the entire task; printing
// "4 left" would answer it. The removed objects stay on screen rather than disappearing, because
// take-away at this stage is about seeing that some of a known group are gone — a child who only saw
// the remainder would be counting a set, not subtracting.
//
// Objects are drawn in payload order with the removed ones last. That is a rendering choice, not a
// transformation of server data: which specific objects count as "removed" is not something the
// payload expresses, only how many.

export function TakeAway({ visual }: { visual: TakeAwayVisual }) {
  const remaining = visual.total - visual.removed;

  return (
    <View accessibilityLabel="A group of circles, with some taken away" style={styles.tray}>
      {Array.from({ length: visual.total }).map((_unused, index) => {
        const isRemoved = index >= remaining;
        return (
          <View
            // Individually focusable, unnumbered, and distinguishing only kept from taken away — the
            // same information a sighted child gets, with no quantity stated.
            accessibilityLabel={isRemoved ? 'Circle, taken away' : 'Circle'}
            accessibilityRole="image"
            accessible
            key={index}
            style={styles.slot}>
            <View style={[styles.object, isRemoved && styles.objectRemoved]} />
            {isRemoved ? <View style={styles.strike} /> : null}
          </View>
        );
      })}
    </View>
  );
}

const OBJECT_SIZE = 28;

const styles = StyleSheet.create({
  object: {
    backgroundColor: colors.accentBlue,
    borderColor: colors.surface1,
    borderRadius: OBJECT_SIZE / 2,
    borderWidth: 2,
    height: OBJECT_SIZE,
    width: OBJECT_SIZE,
  },
  objectRemoved: {
    backgroundColor: colors.surface3,
    borderColor: colors.borderStrong,
    opacity: 0.55,
  },
  slot: {
    alignItems: 'center',
    height: OBJECT_SIZE,
    justifyContent: 'center',
    width: OBJECT_SIZE,
  },
  strike: {
    backgroundColor: colors.danger,
    borderRadius: 2,
    height: 3,
    position: 'absolute',
    transform: [{ rotate: '-45deg' }],
    width: OBJECT_SIZE + 6,
  },
  tray: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderColor: colors.secondary,
    borderRadius: radius.lg,
    borderWidth: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.smPlus,
    justifyContent: 'center',
    padding: spacing.md,
  },
});
