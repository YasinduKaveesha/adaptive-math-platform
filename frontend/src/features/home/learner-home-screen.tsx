import { useRef } from 'react';

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Animated, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/src/auth/auth-context';
import { AppText } from '@/src/components/app-text';
import { LearnerTabBar } from '@/src/features/navigation/learner-tab-bar';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';

const brandArtwork = require('../../../assets/images/mathmingo-header.png');
const heroArtwork = require('../../../assets/images/hero-section.png');
const learningPathArtwork = require('../../../assets/images/learning-path.png');
const heroAspectRatio = 1672 / 941;

type ComponentBSkillId =
  | 'counting'
  | 'number_sense'
  | 'place_value'
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division';

const componentBSkills = {
  counting: { eligibleGrades: [2, 3], label: 'Counting' },
  number_sense: { eligibleGrades: [2, 3], label: 'Number Sense' },
  place_value: { eligibleGrades: [2, 3], label: 'Place Value' },
  addition: { eligibleGrades: [2, 3], label: 'Addition' },
  subtraction: { eligibleGrades: [2, 3], label: 'Subtraction' },
  multiplication: { eligibleGrades: [3], label: 'Multiplication' },
  division: { eligibleGrades: [3], label: 'Division' },
} as const satisfies Record<ComponentBSkillId, { eligibleGrades: readonly (2 | 3)[]; label: string }>;

const pathNodes = [
  { color: colors.primary, left: '5%', skillId: 'counting', state: 'current', subtitle: 'Current Lesson', top: '14%' },
  { color: colors.accentBlue, left: '20%', skillId: 'number_sense', state: 'planned', subtitle: 'On your path', top: '27.5%' },
  { color: colors.accentGreen, left: '9%', skillId: 'place_value', state: 'planned', subtitle: 'On your path', top: '41%' },
  { color: '#ffb51f', left: '19%', skillId: 'addition', state: 'planned', subtitle: 'On your path', top: '54.5%' },
  { color: '#9a64df', left: '20%', skillId: 'subtraction', state: 'planned', subtitle: 'On your path', top: '68%' },
] as const;

/** Shared learner landing page; Component B owns the lesson path and preparation entry points. */
export function LearnerHomeScreen() {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height < 760;
  const { me, profileName } = useAuth();
  const displayName = me?.learner?.display_name?.trim() || profileName || 'Yass';
  const openBLearning = () => router.push('/(learner)/prepare');
  const scrollY = useRef(new Animated.Value(0)).current;
  const introOpacity = scrollY.interpolate({
    extrapolate: 'clamp',
    inputRange: [0, 150],
    outputRange: [1, 0],
  });
  const introLift = scrollY.interpolate({
    extrapolate: 'clamp',
    inputRange: [0, 150],
    outputRange: [0, -36],
  });
  const continuationFadeOpacity = scrollY.interpolate({
    extrapolate: 'clamp',
    inputRange: [0, 10],
    outputRange: [1, 0],
  });
  const usableHeight = height - insets.top - insets.bottom;
  const fixedHeaderHeight = compact ? 63 : 88;
  const fixedNavHeight = (compact ? 61 : 73) + 11.75;
  const pathViewportHeight = Math.max(0, usableHeight - fixedHeaderHeight - fixedNavHeight);
  const pathPanelWidth = Math.min(
    Math.min(width, 500) - spacing.md,
    Math.max(0, pathViewportHeight - spacing.xl) * (941 / 1672),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mobileCanvas}>
        <View style={[styles.headerGreetingSection, compact && styles.sectionCompact]}>
          <View style={styles.header}>
            <View style={styles.brand}>
              <Image
                accessibilityLabel="MathMingo"
                contentFit="contain"
                source={brandArtwork}
                style={[styles.brandArtwork, compact && styles.brandArtworkCompact]}
              />
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

        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: Platform.OS !== 'web' },
          )}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}>
          <Animated.View
            style={[
              styles.heroSection,
              compact && styles.sectionCompact,
              { opacity: introOpacity, transform: [{ translateY: introLift }] },
            ]}>
            <View style={styles.hero}>
              <Image
                accessibilityLabel="MathMingo adventure landscape"
                contentFit="cover"
                source={heroArtwork}
                style={styles.heroArtwork}
              />
              <View style={styles.heroCopy}>
                <AppText style={[styles.heroTitle, compact && styles.heroTitleCompact]}>
                  Let&apos;s make math
                </AppText>
                <View style={styles.heroAdventureLine}>
                  <AppText style={[styles.heroTitle, styles.heroAdventureLead, compact && styles.heroTitleCompact]}>
                    an
                  </AppText>
                  <AppText style={[styles.heroAdventure, compact && styles.heroAdventureCompact]}>
                    adventure!
                  </AppText>
                </View>
              </View>
              <Pressable
                accessibilityHint="Opens session preparation"
                accessibilityRole="button"
                onPress={openBLearning}
                style={({ pressed }) => [
                  styles.heroButton,
                  compact && styles.heroButtonCompact,
                  pressed && styles.buttonPressed,
                ]}>
                <AppText style={[styles.heroButtonText, compact && styles.heroButtonTextCompact]}>
                  Continue Adventure
                </AppText>
                <Ionicons color={colors.primaryForeground} name="chevron-forward" size={compact ? 18.6 : 22.32} />
              </Pressable>
            </View>
          </Animated.View>

          <View style={[styles.dashboardSection, { minHeight: pathViewportHeight }]}>
            <View style={[styles.pathPanel, { width: pathPanelWidth }]}>
                <Image
                  accessibilityLabel="Learning path through five lessons to a treasure chest"
                  contentFit="cover"
                  source={learningPathArtwork}
                  style={styles.learningPathArtwork}
                />
                <View style={styles.pathHeading}>
                  <Ionicons color={colors.accentGreen} name="map" size={compact ? 22.5 : 27} />
                  <AppText style={[styles.pathHeadingText, compact && styles.pathHeadingTextCompact]}>
                    Your Learning Path
                  </AppText>
                </View>
                {pathNodes.map((node, index) => {
                  const skill = componentBSkills[node.skillId];
                  const isCurrent = node.state === 'current';
                  const stageContent = (
                    <>
                    <View
                      style={[
                        styles.pathStageNumber,
                        { backgroundColor: node.color },
                        isCurrent && styles.pathStageNumberActive,
                      ]}>
                      <AppText style={[styles.pathStageNumberText, compact && styles.pathStageNumberTextCompact]}>
                        {index + 1}
                      </AppText>
                    </View>
                    <View style={[styles.pathStageCard, isCurrent && styles.pathStageCardActive]}>
                      <View style={styles.pathStageCopy}>
                        <AppText style={[styles.pathStageTitle, compact && styles.pathStageTitleCompact]}>
                          {skill.label}
                        </AppText>
                        <View style={styles.pathStageProgress}>
                          {!isCurrent && <Ionicons color="#ffb51f" name="star" size={compact ? 11.5 : 13.8} />}
                          <AppText
                            style={[
                              styles.pathStageSubtitle,
                              compact && styles.pathStageSubtitleCompact,
                              isCurrent && styles.pathStageSubtitleActive,
                              isCurrent && compact && styles.pathStageSubtitleActiveCompact,
                              isCurrent && { color: node.color },
                            ]}>
                            {node.subtitle}
                          </AppText>
                        </View>
                      </View>
                      <Ionicons
                        color={isCurrent ? colors.primary : node.color}
                        name={isCurrent ? 'play' : 'sparkles'}
                        size={isCurrent ? (compact ? 22.4 : 27.2) : compact ? 17.6 : 20.8}
                      />
                    </View>
                    </>
                  );

                  if (isCurrent) {
                    return (
                      <Pressable
                        accessibilityHint="Opens Component B session preparation"
                        accessibilityLabel={`${skill.label}, current lesson`}
                        accessibilityRole="button"
                        key={node.skillId}
                        onPress={openBLearning}
                        style={({ pressed }) => [
                          styles.pathStage,
                          { left: node.left, top: node.top },
                          pressed && styles.pathStagePressed,
                        ]}>
                        {stageContent}
                      </Pressable>
                    );
                  }

                  return (
                    <View
                      accessibilityLabel={`${skill.label}, on your learning path`}
                      accessible
                      key={node.skillId}
                      style={[styles.pathStage, { left: node.left, top: node.top }]}>
                      {stageContent}
                    </View>
                  );
                })}
            </View>
          </View>
        </Animated.ScrollView>

        <Animated.View
          style={[
            styles.scrollContinuationFade,
            { bottom: fixedNavHeight, opacity: continuationFadeOpacity },
          ]}
        >
          <View style={styles.scrollContinuationFade1} />
          <View style={styles.scrollContinuationFade2} />
          <View style={styles.scrollContinuationFade3} />
          <View style={styles.scrollContinuationFade4} />
          <View style={styles.scrollContinuationFade5} />
          <View style={styles.scrollContinuationFade6} />
          <View style={styles.scrollContinuationFade7} />
        </Animated.View>
        <LearnerTabBar activeTab="home" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', flexDirection: 'row', flexShrink: 1, gap: 3 },
  brandArtwork: { aspectRatio: 1916 / 821, height: 68 },
  brandArtworkCompact: { height: 56 },
  buttonPressed: { borderBottomWidth: 0, transform: [{ translateY: 3 }] },
  dashboardSection: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.md, width: '100%' },
  dots: { flexDirection: 'row', gap: 2, marginTop: 2 },
  greeting: { alignItems: 'flex-end', flexShrink: 1, justifyContent: 'center' },
  greetingName: { color: '#26A5FD', fontFamily: typography.fonts.heavy, fontSize: 33.75, lineHeight: 40.5 },
  greetingNameCompact: { fontSize: 28.35, lineHeight: 33.75 },
  greetingTitle: { fontFamily: typography.fonts.body, fontSize: 25, lineHeight: 30 },
  greetingTitleCompact: { fontSize: 21, lineHeight: 25 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 4, justifyContent: 'space-between' },
  headerGreetingSection: { backgroundColor: colors.background, flexShrink: 0, paddingBottom: spacing.md, paddingHorizontal: spacing.smPlus, paddingTop: 4, zIndex: 10 },
  hero: { aspectRatio: heroAspectRatio, backgroundColor: colors.secondarySoft, borderColor: colors.surface1, borderRadius: radius.lg, borderWidth: 4, elevation: 5, overflow: 'hidden', padding: spacing.smPlus, position: 'relative', shadowColor: colors.foreground, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 7, width: '100%' },
  heroArtwork: { ...StyleSheet.absoluteFillObject, height: '100%', width: '100%' },
  heroAdventure: { color: '#FEC632', fontFamily: typography.fonts.display, fontSize: 34.32, lineHeight: 39.6 },
  heroAdventureCompact: { fontSize: 29.04, lineHeight: 35.2 },
  heroAdventureLead: { marginRight: 5 },
  heroAdventureLine: { alignItems: 'baseline', flexDirection: 'row' },
  heroButton: { alignItems: 'center', backgroundColor: colors.primary, borderColor: colors.surface1, borderRadius: 14.88, borderWidth: 2, bottom: spacing.smPlus, elevation: 4, flexDirection: 'row', gap: 4.96, justifyContent: 'center', left: spacing.smPlus, minHeight: 49.6, paddingHorizontal: 14.88, position: 'absolute', shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 4, zIndex: 2 },
  heroButtonCompact: { bottom: spacing.sm, left: spacing.sm, minHeight: 44.64, paddingHorizontal: 12.4 },
  heroButtonText: { color: colors.primaryForeground, fontFamily: typography.fonts.bold, fontSize: 13.64, lineHeight: 22.32, textAlign: 'center' },
  heroButtonTextCompact: { fontSize: 12.4, lineHeight: 19.84 },
  heroCopy: { gap: 2, maxWidth: '62%', zIndex: 2 },
  heroSection: { paddingBottom: 5, paddingHorizontal: spacing.sm },
  heroTitle: { fontFamily: typography.fonts.display, fontSize: 23.94, lineHeight: 27.72 },
  heroTitleCompact: { fontSize: 20.16, lineHeight: 24.36 },
  inactiveDot: { backgroundColor: colors.surface3, borderRadius: radius.pill, height: 4, width: 4 },
  learningPathArtwork: { ...StyleSheet.absoluteFillObject, height: '100%', width: '100%' },
  missionCopy: { flex: 1, gap: 2 },
  missionLabel: { fontFamily: typography.fonts.bold, fontSize: 9, lineHeight: 12 },
  missionLabelCompact: { fontSize: 7, lineHeight: 9 },
  missionPanel: { flex: 0.37 },
  missionRow: { alignItems: 'center', backgroundColor: '#fff9df', borderColor: '#f6e9aa', borderRadius: radius.sm, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 3, minHeight: 0, paddingHorizontal: 5 },
  missionRowCompact: { paddingHorizontal: 3 },
  missionTrack: { backgroundColor: colors.surface3, borderRadius: radius.pill, height: 4 },
  missionValue: { color: colors.textSecondary, fontSize: 8 },
  mobileCanvas: { alignSelf: 'center', backgroundColor: colors.background, flex: 1, maxWidth: 500, width: '100%' },
  panel: { backgroundColor: colors.surface1, borderBottomColor: colors.borderStrong, borderBottomWidth: 2, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: 4, minHeight: 0, padding: 6 },
  panelHeading: { alignItems: 'center', flexDirection: 'row', gap: 3, minHeight: 18 },
  panelTitle: { flex: 1, fontFamily: typography.fonts.display, fontSize: 11, lineHeight: 14 },
  panelTitleCompact: { fontSize: 9, lineHeight: 11 },
  pathHeading: { alignItems: 'center', flexDirection: 'row', gap: 4, left: '6%', position: 'absolute', top: '3%' },
  pathHeadingText: { fontFamily: typography.fonts.heavy, fontSize: 18, lineHeight: 22.5 },
  pathHeadingTextCompact: { fontSize: 15, lineHeight: 18 },
  pathPanel: { alignSelf: 'center', aspectRatio: 941 / 1672, borderColor: colors.surface1, borderRadius: radius.lg, borderWidth: 3, elevation: 4, maxWidth: '100%', overflow: 'hidden', position: 'relative', shadowColor: colors.foreground, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 6 },
  pathStage: { alignItems: 'center', flexDirection: 'row', height: '11.5%', position: 'absolute', right: '3%' },
  pathStageCard: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.96)', borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, elevation: 2, flex: 1, flexDirection: 'row', height: '78%', justifyContent: 'space-between', marginLeft: -8, paddingLeft: 12, paddingRight: 7, shadowColor: colors.foreground, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
  pathStageCardActive: { borderColor: colors.primarySoft },
  pathStageCopy: { flex: 1, gap: 4, justifyContent: 'center' },
  pathStageNumber: { alignItems: 'center', aspectRatio: 1, borderColor: colors.surface1, borderRadius: radius.pill, borderWidth: 3, elevation: 4, height: '80%', justifyContent: 'center', shadowColor: colors.foreground, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 4, zIndex: 2 },
  pathStageNumberActive: { borderColor: colors.accentYellow },
  pathStageNumberText: { color: colors.primaryForeground, fontFamily: typography.fonts.display, fontSize: 18, lineHeight: 22 },
  pathStageNumberTextCompact: { fontSize: 15, lineHeight: 18 },
  pathStageProgress: { alignItems: 'center', flexDirection: 'row', gap: 2 },
  pathStagePressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  pathStageSubtitle: { color: colors.textSecondary, fontFamily: typography.fonts.body, fontSize: 9.2, lineHeight: 11.5 },
  pathStageSubtitleActive: { color: colors.primary, fontSize: 13.8, lineHeight: 16.5 },
  pathStageSubtitleActiveCompact: { fontSize: 11.5, lineHeight: 13.8 },
  pathStageSubtitleCompact: { fontSize: 8.05, lineHeight: 10.35 },
  pathStageTitle: { fontFamily: typography.fonts.heavy, fontSize: 15, lineHeight: 18 },
  pathStageTitleCompact: { fontSize: 12, lineHeight: 15 },
  progressPanel: { flex: 0.63 },
  safeArea: { backgroundColor: colors.background, flex: 1 },
  scrollContent: {},
  scrollContinuationFade: { height: 27, left: spacing.sm, pointerEvents: 'none', position: 'absolute', right: spacing.sm, zIndex: 9 },
  scrollContinuationFade1: { backgroundColor: 'rgba(244,244,246,0.06)', flex: 1 },
  scrollContinuationFade2: { backgroundColor: 'rgba(244,244,246,0.14)', flex: 1 },
  scrollContinuationFade3: { backgroundColor: 'rgba(244,244,246,0.24)', flex: 1 },
  scrollContinuationFade4: { backgroundColor: 'rgba(244,244,246,0.36)', flex: 1 },
  scrollContinuationFade5: { backgroundColor: 'rgba(244,244,246,0.5)', flex: 1 },
  scrollContinuationFade6: { backgroundColor: 'rgba(244,244,246,0.66)', flex: 1 },
  scrollContinuationFade7: { backgroundColor: 'rgba(244,244,246,0.82)', flex: 1 },
  scrollView: { flex: 1 },
  sectionCompact: { paddingBottom: 3 },
  sideColumn: { flex: 0.94, gap: 6, minHeight: 0 },
  stageArtwork: { alignItems: 'center', aspectRatio: 1, borderRadius: radius.pill, justifyContent: 'center', width: 30 },
  stageArtworkCompact: { width: 24 },
  stageCard: { alignItems: 'center', borderRadius: radius.sm, flex: 1, flexDirection: 'row', gap: 4, minHeight: 0, paddingHorizontal: 4 },
  stageCopy: { flex: 1 },
  stageDescription: { color: colors.textSecondary, fontSize: 7, lineHeight: 9 },
  stageDescriptionCompact: { fontSize: 6, lineHeight: 7 },
  stageList: { flex: 1, gap: 3, minHeight: 0 },
  stageTitle: { fontFamily: typography.fonts.bold, fontSize: 9, lineHeight: 11 },
  stageTitleCompact: { fontSize: 7, lineHeight: 9 },
  statCard: { alignItems: 'center', backgroundColor: colors.surface1, borderBottomColor: colors.borderStrong, borderBottomWidth: 2, borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1, justifyContent: 'center', minWidth: 38, paddingHorizontal: 3, paddingVertical: 2 },
  statCardCompact: { minWidth: 32, paddingHorizontal: 2, paddingVertical: 1 },
  statLabel: { color: colors.textSecondary, fontSize: 6, lineHeight: 8 },
  statLabelCompact: { fontSize: 5, lineHeight: 6 },
  stats: { alignSelf: 'stretch', flexDirection: 'row', gap: 3 },
  statValue: { fontFamily: typography.fonts.bold, fontSize: 10, lineHeight: 12 },
  statValueCompact: { fontSize: 8, lineHeight: 9 },
});
