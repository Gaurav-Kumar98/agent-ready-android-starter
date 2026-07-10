import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { useAuth } from '@/features/auth/auth-provider';

export default function AppLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }
  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} />,
        }}
      />
      {/* Pushed via router.push('/paywall'), not a tab. */}
      <Tabs.Screen name="paywall" options={{ href: null }} />
    </Tabs>
  );
}
