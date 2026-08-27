// The learner's own profile: the four facts about their account this app can actually show (name,
// classroom, grade, gender) and a way to sign out. Nothing here is invented — every field comes
// straight from `useAuth()`, the same sources session-preparation-screen.tsx and
// learner-home-screen.tsx already read (`me.learnerProfile.name`, `me.classroomMembership`), plus
// `profileGender` (new: auth-context.tsx's own gender is captured at sign-up into Supabase's
// user_metadata, since the backend's LearnerProfileResponse carries no gender field at all — see
// that file's readGender for why it's read from the session rather than from `me`).
//
// A field with nothing to show renders neither a fabricated value nor an error: a classroom only
// renders once an APPROVED membership actually exists (mirroring the prep screen's own
// `classroom` derivation exactly), and gender only renders once a value was actually captured.
// There is no "Not set" placeholder row for either — an absent fact is not itself a fact worth
// display space.

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/auth/auth-context';
import { AppText } from '@/src/components/app-text';
import { LearnerHeaderBar } from '@/src/features/navigation/learner-header-bar';
import { LearnerTabBar } from '@/src/features/navigation/learner-tab-bar';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';
import { firstNameOf } from '@/src/utils/display-name';

const gradeLabels: Record<'GRADE_2' | 'GRADE_3', string> = {
  GRADE_2: 'Grade 2',
  GRADE_3: 'Grade 3',
};

const genderLabels: Record<'female' | 'male', string> = {
  female: 'Girl',
  male: 'Boy',
};

type ProfileRow = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  label: string;
  value: string;
};

export function LearnerProfileScreen() {
  const compact = useWindowDimensions().height < 760;
  const { me, profileGender, profileName, signOut } = useAuth();
  const displayName = me?.learnerProfile?.name.trim() || profileName || 'Math Explorer';
  // Only an APPROVED membership is a real classroom the learner is in — mirrors
  // session-preparation-screen.tsx's own `classroom` derivation exactly, so the two screens can
  // never disagree about whether a classroom is showing.
  const classroom = me?.classroomMembership?.state === 'APPROVED' ? me.classroomMembership : null;

  const rows: ProfileRow[] = [
    { color: colors.primary, icon: 'person', label: 'Name', value: firstNameOf(displayName) },
    ...(classroom
      ? [
          {
            color: colors.accentBlue,
            icon: 'school' as const,
            label: 'Classroom',
            value: classroom.classroom_name ?? 'Your classroom',
          },
          {
            color: colors.accentGreen,
            icon: 'ribbon' as const,
            label: 'Grade',
            value: gradeLabels[classroom.grade],
          },
        ]
      : []),
    ...(profileGender
      ? [
          {
            color: colors.accentWingPink,
            icon: 'happy' as const,
            label: 'Gender',
            value: genderLabels[profileGender],
          },
        ]
      : []),
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mobileCanvas}>
        <LearnerHeaderBar compact={compact} displayName={firstNameOf(displayName)} />

        <View style={[styles.content, compact && styles.contentCompact]}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Ionicons color={colors.primaryForeground} name="person" size={44} />
            </View>
            <AppText style={styles.avatarName}>{displayName}</AppText>
          </View>

          <View style={styles.card}>
            {rows.map((row, index) => (
              <View
                key={row.label}
                style={[styles.row, index === rows.length - 1 && styles.rowLast]}>
                <View style={[styles.rowIcon, { backgroundColor: row.color }]}>
                  <Ionicons color={colors.primaryForeground} name={row.icon} size={20} />
                </View>
                <View style={styles.rowCopy}>
                  <AppText style={styles.rowLabel}>{row.label}</AppText>
                  <AppText style={styles.rowValue}>{row.value}</AppText>
                </View>
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => void signOut()}
            style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}>
            <Ionicons color={colors.danger} name="log-out-outline" size={22} />
            <AppText style={styles.logoutText}>LOG OUT</AppText>
          </Pressable>
        </View>

        <LearnerTabBar activeTab="profile" playEnabled />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatarCircle: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.surface1,
    borderRadius: radius.pill,
    borderWidth: 4,
    elevation: 4,
    height: 96,
    justifyContent: 'center',
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    width: 96,
  },
  avatarName: {
    fontFamily: typography.fonts.display,
    fontSize: typography.fontSize.subtitle,
    lineHeight: typography.lineHeight.subtitle,
  },
  avatarWrap: { alignItems: 'center', gap: spacing.sm },
  card: {
    backgroundColor: colors.surface1,
    borderBottomColor: colors.borderStrong,
    borderBottomWidth: 3,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 2,
    padding: spacing.smPlus,
  },
  content: { flex: 1, gap: spacing.lg, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  contentCompact: { gap: spacing.md },
  logoutButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    borderRadius: radius.md,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 56,
  },
  logoutButtonPressed: { opacity: 0.72 },
  logoutText: {
    color: colors.danger,
    fontFamily: typography.fonts.bold,
    fontSize: typography.fontSize.body,
    letterSpacing: typography.letterSpacing.button,
  },
  mobileCanvas: { alignSelf: 'center', backgroundColor: colors.background, flex: 1, maxWidth: 500, width: '100%' },
  row: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.smPlus,
    paddingVertical: spacing.smPlus,
  },
  rowCopy: { flex: 1, gap: 2 },
  rowIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  rowLabel: { color: colors.textSecondary, fontSize: typography.fontSize.sm },
  rowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  rowValue: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.lg,
  },
  safeArea: { backgroundColor: colors.background, flex: 1 },
});
