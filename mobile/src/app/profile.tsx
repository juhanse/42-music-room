import React, { useState } from 'react';
import { StyleSheet, TextInput, Button, View, Alert, Switch } from 'react-native';
import { ThemedView } from '../components/themed-view';
import { ThemedText } from '../components/themed-text';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

export default function ProfileScreen() {
	const user = useAuthStore((state) => state.user);
	const updateProfile = useAuthStore((state) => state.updateProfile);
	const updateSubscription = useAuthStore((state) => state.updateSubscription);

	const [bio, setBio] = useState(user?.publicInfo?.bio || '');
	const [phone, setPhone] = useState(user?.privateInfo?.phone || '');
	const [favoriteGenre, setFavoriteGenre] = useState(user?.musicPreferences?.favoriteGenre || '');

	const handleSave = async () => {
		try {
			await updateProfile({
				publicInfo: { ...user?.publicInfo, bio },
				privateInfo: { ...user?.privateInfo, phone },
				musicPreferences: { ...user?.musicPreferences, favoriteGenre },
			});
			Alert.alert('Succès', 'Profil mis à jour');
		} catch (error) {
			Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
		}
	};

	const toggleSubscription = async (value: boolean) => {
		const newPlan = value ? 'PREMIUM' : 'FREE';
		try {
			await updateSubscription(newPlan);
			Alert.alert('Abonnement', `Vous êtes maintenant ${newPlan}`);
		} catch (error) {
			Alert.alert('Erreur', "Échec du changement d'abonnement");
		}
	};

	const testPremiumFeature = async () => {
		try {
			const response = await api.get('/users/premium-feature-example');
			Alert.alert('Accès Autorisé', response.data.message);
		} catch (error: any) {
			if (error.response?.status === 403) {
				Alert.alert('Accès Refusé', 'Cette fonctionnalité nécessite un abonnement PREMIUM.');
			}
		}
	};

	if (!user) return null;

	return (
		<ThemedView style={styles.container}>
			<ThemedText type="title" style={styles.title}>Mon Profil</ThemedText>

			<View style={styles.section}>
				<ThemedText style={styles.label}>Informations Publiques (Bio)</ThemedText>
				<TextInput style={styles.input} value={bio} onChangeText={setBio} />
			</View>

			<View style={styles.section}>
				<ThemedText style={styles.label}>Informations Privées (Téléphone)</ThemedText>
				<TextInput style={styles.input} value={phone} onChangeText={setPhone} />
			</View>

			<View style={styles.section}>
				<ThemedText style={styles.label}>Préférences Musicales (Genre)</ThemedText>
				<TextInput style={styles.input} value={favoriteGenre} onChangeText={setFavoriteGenre} />
			</View>

			<Button title="Enregistrer le profil" onPress={handleSave} />

			<View style={styles.separator} />

			<View style={styles.subscriptionContainer}>
				<ThemedText style={styles.label}>Abonnement Premium</ThemedText>
				<Switch 
					value={user.subscriptionPlan === 'PREMIUM'} 
					onValueChange={toggleSubscription} 
				/>
			</View>

			<Button 
				title="Ouvrir l'éditeur de Playlist" 
				onPress={testPremiumFeature} 
				color="#007AFF"
			/>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, padding: 20 },
	title: { marginBottom: 20, textAlign: 'center' },
	section: { marginBottom: 15 },
	label: { marginBottom: 5, fontWeight: 'bold' },
	input: { height: 40, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, backgroundColor: '#fff' },
	separator: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
	subscriptionContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
});
