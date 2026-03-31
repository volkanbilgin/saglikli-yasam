import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { DateProvider } from '../src/context/DateContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

function AuthGate() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inLoginPage = segments[0] === 'login';
    if (!user && !inLoginPage) {
      router.replace('/login');
    } else if (user && inLoginPage) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0f1a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#2ecc71" size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <DateProvider>
        <StatusBar style="light" />
        <AuthGate />
      </DateProvider>
    </AuthProvider>
  );
}
