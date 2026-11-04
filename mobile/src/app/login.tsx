import React, { useState } from 'react';
import { StyleSheet, TextInput, Button, Pressable, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ThemedView } from '../components/themed-view';
import { ThemedText } from '../components/themed-text';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

export default function LoginScreen() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const login = useAuthStore((state) => state.login);
	const router = useRouter();

	const handleLogin = async () => {
		setErrorMessage('');

		if (!email.trim() || !password.trim()) {
			setErrorMessage('Veuillez remplir tous les champs.');
			return;
		}

		try {
			const response = await api.post('/auth/login', { email, password });
			await login(response.data.token, response.data.user);
			router.replace('/');
		} catch (error: any) {
			let message = 'Erreur réseau ou serveur injoignable';
			const errorData = error.response?.data;

			if (errorData) {
				if (typeof errorData.error === 'string') {
					message = errorData.error;
				} else if (typeof errorData === 'string') {
					message = errorData;
				} else {
					message = 'Identifiants invalides ou format incorrect.';
				}
			} else if (error.message) {
				message = error.message;
			}

			setErrorMessage(message);
		}
	};

	const handleGoogleLogin = () => {
		setErrorMessage('Intégration du SDK Google OAuth à réaliser.');
	};

	return (
		<ThemedView style={styles.container}>
			<ThemedText type="title" style={styles.title}>Connexion</ThemedText>

			{errorMessage ? (
				<ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
			) : null}

			<TextInput
				style={styles.input}
				placeholder="Email"
				value={email}
				onChangeText={setEmail}
				autoCapitalize="none"
				keyboardType="email-address"
			/>

			<TextInput
				style={styles.input}
				placeholder="Mot de passe"
				value={password}
				onChangeText={setPassword}
				secureTextEntry
			/>

			<Button title="Se connecter" onPress={handleLogin} />

			<View style={styles.separatorContainer}>
				<View style={styles.separatorLine} />
				<ThemedText style={styles.separatorText}>OU</ThemedText>
				<View style={styles.separatorLine} />
			</View>

			<Pressable style={styles.googleButton} onPress={handleGoogleLogin}>
				<ThemedText style={styles.googleButtonText}>Se connecter avec Google</ThemedText>
			</Pressable>

			<Link href="/register" style={styles.link}>
				<ThemedText type="link">Créer un compte</ThemedText>
			</Link>

			<Link href="/forgot-password" style={styles.link}>
				<ThemedText type="link">Mot de passe oublié ?</ThemedText>
			</Link>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, padding: 20, justifyContent: 'center' },
	title: { marginBottom: 30, textAlign: 'center' },
	errorText: { color: '#ff3b30', marginBottom: 15, textAlign: 'center', fontWeight: 'bold' },
	input: { height: 50, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, backgroundColor: '#fff' },
	link: { marginTop: 15, textAlign: 'center' },
	separatorContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
	separatorLine: { flex: 1, height: 1, backgroundColor: '#ccc' },
	separatorText: { marginHorizontal: 10, color: '#888' },
	googleButton: { backgroundColor: '#fff', height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
	googleButtonText: { color: '#757575', fontSize: 16, fontWeight: '600' },
});
