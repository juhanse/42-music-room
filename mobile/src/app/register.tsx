import React, { useState } from 'react';
import { StyleSheet, TextInput, Button, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ThemedView } from '../components/themed-view';
import { ThemedText } from '../components/themed-text';
import { api } from '../services/api';

export default function RegisterScreen() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const router = useRouter();

	const handleRegister = async () => {
		setErrorMessage('');

		if (!email.trim() || !password.trim()) {
			setErrorMessage('Veuillez remplir tous les champs.');
			return;
		}

		try {
			await api.post('/auth/register', { email, password });
			Alert.alert('Succès', 'Compte créé. Vérifiez vos emails pour valider votre compte.');
			router.replace('/login');
		} catch (error: any) {
			let message = 'Erreur réseau ou serveur injoignable';
			const errorData = error.response?.data;

			if (errorData) {
				if (typeof errorData.error === 'string') {
					message = errorData.error;
				} else if (typeof errorData === 'string') {
					message = errorData;
				} else {
					message = 'Données invalides ou format incorrect.';
				}
			} else if (error.message) {
				message = error.message;
			}

			setErrorMessage(message);
		}
	};

	return (
		<ThemedView style={styles.container}>
			<ThemedText type="title" style={styles.title}>Inscription</ThemedText>

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

			<Button title="S'inscrire" onPress={handleRegister} />

			<Link href="/login" style={styles.link}>
				<ThemedText type="link">Déjà un compte ? Se connecter</ThemedText>
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
});
