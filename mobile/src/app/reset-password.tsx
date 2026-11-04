import React, { useState } from 'react';
import { StyleSheet, TextInput, Button, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '../components/themed-view';
import { ThemedText } from '../components/themed-text';
import { api } from '../services/api';

export default function ResetPasswordScreen() {
	const { token } = useLocalSearchParams<{ token: string }>();
	const [password, setPassword] = useState('');
	const router = useRouter();

	const handleResetPassword = async () => {
		if (!token) {
			Alert.alert('Erreur', 'Token de réinitialisation manquant.');
			return;
		}

		try {
			await api.post('/auth/reset-password', { token, password });
			Alert.alert('Succès', 'Votre mot de passe a été mis à jour.');
			router.replace('/login');
		} catch (error: any) {
			Alert.alert('Erreur', error.response?.data?.error || 'Le lien est invalide ou expiré.');
		}
	};

	return (
		<ThemedView style={styles.container}>
			<ThemedText type="title" style={styles.title}>Nouveau mot de passe</ThemedText>

			<TextInput
				style={styles.input}
				placeholder="Nouveau mot de passe"
				value={password}
				onChangeText={setPassword}
				secureTextEntry
			/>

			<Button title="Mettre à jour" onPress={handleResetPassword} />
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, padding: 20, justifyContent: 'center' },
	title: { marginBottom: 30, textAlign: 'center' },
	input: { height: 50, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, backgroundColor: '#fff' },
});
