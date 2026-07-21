import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LearnerTabBar } from '@/src/features/navigation/learner-tab-bar';
import { colors } from '@/src/theme/tokens';

export function LearnerEmptyTabScreen({ activeTab }: { activeTab: 'play' | 'profile' }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mobileCanvas}>
        <View style={styles.emptyContent} />
        <LearnerTabBar activeTab={activeTab} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  emptyContent: { flex: 1 },
  mobileCanvas: { alignSelf: 'center', backgroundColor: colors.background, flex: 1, maxWidth: 500, width: '100%' },
  safeArea: { backgroundColor: colors.background, flex: 1 },
});
