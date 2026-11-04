import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { useAuthStore } from '../store/authStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const { user, isLoading, checkAuth } = useAuthStore();
	const segments = useSegments();
	const router = useRouter();

	useEffect(() => {
		checkAuth();
	}, []);

	useEffect(() => {
		if (isLoading) return;

		const inAuthGroup = segments[0] === 'login' || segments[0] === 'register' || segments[0] === 'forgot-password' || segments[0] === 'reset-password';

		if (!user && !inAuthGroup) {
			router.replace('/login');
		} else if (user && inAuthGroup) {
			router.replace('/');
		}

		SplashScreen.hideAsync();
	}, [user, isLoading, segments]);

	if (isLoading) return null;

	return (
		<ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
			<Slot />
		</ThemeProvider>
	);
}
