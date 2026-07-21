import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { colors, radius, spacing } from '@/src/theme/tokens';

const tabArtwork = {
  play: require('../../../assets/images/tabs/game.png'),
  playSelected: require('../../../assets/images/tabs/game-selected.png'),
  home: require('../../../assets/images/tabs/home.png'),
  homeSelected: require('../../../assets/images/tabs/home-selected.png'),
  profile: require('../../../assets/images/tabs/profile.png'),
  profileSelected: require('../../../assets/images/tabs/profile-selected.png'),
};

type LearnerTab = 'home' | 'play' | 'profile';

export function LearnerTabBar({
  activeTab,
  activeHomePressEnabled = false,
  playEnabled = false,
}: {
  activeTab: LearnerTab;
  activeHomePressEnabled?: boolean;
  playEnabled?: boolean;
}) {
  const compact = useWindowDimensions().height < 760;

  return (
    <View style={[styles.bottomNav, compact && styles.bottomNavCompact]}>
      <TabItem
        active={activeTab === 'home'}
        label="Home"
        onPress={() => router.replace('/(learner)/home')}
        pressWhenActive={activeHomePressEnabled}
        selectedSource={tabArtwork.homeSelected}
        source={tabArtwork.home}
      />
      <TabItem
        active={activeTab === 'play'}
        accessibilityHint={playEnabled ? 'Opens adaptive games' : 'Adaptive games will be available with Component C'}
        disabled={!playEnabled}
        label="Play"
        onPress={() => router.replace('/(learner)/play')}
        selectedSource={tabArtwork.playSelected}
        source={tabArtwork.play}
      />
      <TabItem
        active={activeTab === 'profile'}
        label="Profile"
        onPress={() => router.replace('/(learner)/profile')}
        selectedSource={tabArtwork.profileSelected}
        source={tabArtwork.profile}
      />
    </View>
  );
}

function TabItem({ active, accessibilityHint, disabled = false, label, onPress, pressWhenActive = false, selectedSource, source }: {
  active: boolean;
  accessibilityHint?: string;
  disabled?: boolean;
  label: string;
  onPress: () => void;
  pressWhenActive?: boolean;
  selectedSource: number;
  source: number;
}) {
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={`${label} tab${active ? ', selected' : disabled ? ', unavailable' : ''}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || undefined, selected: active }}
      disabled={(active && !pressWhenActive) || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.navItem,
        active && styles.navItemSelected,
        disabled && styles.navItemDisabled,
        pressed && styles.navItemPressed,
      ]}>
      <Image
        accessible={false}
        contentFit="cover"
        source={active ? selectedSource : source}
        style={styles.navArtwork}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    alignItems: 'center',
    backgroundColor: colors.surface1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    elevation: 6,
    flexDirection: 'row',
    height: 73,
    justifyContent: 'space-around',
    marginBottom: 11.75,
    marginHorizontal: spacing.sm,
    minHeight: 0,
    paddingHorizontal: 2,
    paddingVertical: 2,
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  bottomNavCompact: { height: 61 },
  navArtwork: { borderRadius: radius.lg, height: '100%', width: '100%' },
  navItem: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: colors.surface1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    elevation: 4,
    height: '93%',
    justifyContent: 'center',
    padding: 2,
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 7,
  },
  navItemDisabled: { opacity: 0.48 },
  navItemPressed: {
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    transform: [{ translateY: 2 }],
  },
  navItemSelected: {
    borderColor: colors.primarySoft,
    elevation: 6,
    shadowColor: colors.primaryShadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 9,
  },
});
