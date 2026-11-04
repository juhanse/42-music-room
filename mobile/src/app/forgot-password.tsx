import React, { useState } from 'react';
import { StyleSheet, TextInput, Button, Alert } from 'react-native';
import { Link } from 'expo-router';
import { ThemedView } from '../components/themed-view';
import { ThemedText } from '../components/themed-text';
import { api } from '../services/api';

export default function ForgotPasswordScreen() {
	const [email, setEmail] = useState('');

	const handleResetRequest = async () => {
		try {
			await api.post('/auth/forgot-password', { email });
			Alert.alert('Vérifiez vos emails', 'Si ce compte existe, un lien de réinitialisation a été envoyé.');
		} catch (error) {
			Alert.alert('Erreur', 'Impossible de traiter la demande.');
		}
	};

	return (
		<ThemedView style={styles.container}>
			<ThemedText type="title" style={styles.title}>Mot de passe oublié</ThemedText>
			<ThemedText style={styles.subtitle}>Entrez votre email pour recevoir un lien de réinitialisation.</ThemedText>

			<TextInput
				style={styles.input}
				placeholder="Email"
				value={email}
				onChangeText={setEmail}
				autoCapitalize="none"
				keyboardType="email-address"
			/>

			<Button title="Envoyer le lien" onPress={handleResetRequest} />

			<Link href="/login" style={styles.link}>
				<ThemedText type="link">Retour à la connexion</ThemedText>
			</Link>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, padding: 20, justifyContent: 'center' },
	title: { marginBottom: 15, textAlign: 'center' },
	subtitle: { marginBottom: 30, textAlign: 'center' },
	input: { height: 50, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, backgroundColor: '#fff' },
	link: { marginTop: 15, textAlign: 'center' },
});
