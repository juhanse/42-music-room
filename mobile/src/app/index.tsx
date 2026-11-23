import { useEffect } from 'react';
import { StyleSheet, Button } from 'react-native';
import { ThemedView } from '../components/themed-view';
import { ThemedText } from '../components/themed-text';
import { useAuthStore } from '../store/authStore';

export default function HomeScreen() {
	const { user, isLoading, checkAuth, logout } = useAuthStore();

	useEffect(() => {
		checkAuth();
	}, []);

	if (isLoading) {
		return <ThemedText>Chargement...</ThemedText>;
	}

	if (!user) {
		return <ThemedText>Non connecté</ThemedText>;
	}

	return (
		<ThemedView style={styles.container}>
			<ThemedText type="title" style={styles.title}>Music Room</ThemedText>
			<ThemedText style={styles.subtitle}>
				Bienvenue, {user?.email || user?.id}
			</ThemedText>

			<Button title="Se déconnecter" onPress={logout} color="#ff3b30" />
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
	title: { marginBottom: 10 },
	subtitle: { marginBottom: 30 },
});
