import { Stack } from 'expo-router';

import { AdventureChargeProvider } from '@/src/features/navigation/adventure-charge-context';

export default function LearnerLayout() {
  return (
    <AdventureChargeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AdventureChargeProvider>
  );
}
