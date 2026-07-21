import { Redirect } from 'expo-router';

import { useAuth } from '@/src/auth/auth-context';
import { AppText } from '@/src/components/app-text';
import { ScreenShell } from '@/src/components/screen-shell';

/**
 * Page 0 bootstrap route.
 * Page 1 will replace this temporary redirect with secure session restoration
 * and backend authorization before choosing an application destination.
 */
export default function BootstrapRoute() {
  const { status } = useAuth();

  // Authentication and teacher-link onboarding are deferred during Component B
  // page construction. This bypass is deliberately limited to development.
  if (process.env.EXPO_PUBLIC_APP_ENV === 'development') {
    return <Redirect href="/(learner)/home" />;
  }

  if (status === 'checking') {
    return (
      <ScreenShell centered>
        <AppText align="center" variant="subtitle">Checking secure access…</AppText>
      </ScreenShell>
    );
  }

  if (status === 'authorized' || status === 'preview') {
    return <Redirect href="/(learner)/home" />;
  }
  if (status === 'onboarding') return <Redirect href="/(onboarding)/welcome" />;
  return <Redirect href="/(auth)/sign-in" />;
}
