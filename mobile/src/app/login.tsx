import React, { useState, useEffect } from 'react';
import { Platform, StyleSheet, TextInput, Pressable, View, KeyboardAvoidingView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { AntDesign } from '@react-native-vector-icons/ant-design';
import { ThemedText } from '../components/themed-text';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

let GoogleSignin: any = null;
try {
	if (Platform.OS !== 'web') {
		GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
	}
} catch (error) {
}

export default function LoginScreen() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const login = useAuthStore((state) => state.login);
	const router = useRouter();

	useEffect(() => {
		if (GoogleSignin) {
			GoogleSignin.configure({
				webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
				iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
			});
		}
	}, []);

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

	const handleGoogleLogin = async () => {
		setErrorMessage('');

		if (Platform.OS === 'web') {
			setErrorMessage("La connexion Google est uniquement disponible sur l'application mobile.");
			return;
		}

		if (!GoogleSignin) {
			setErrorMessage("Google Auth nécessite un Development Build. Incompatible avec Expo Go.");
			return;
		}

		try {
			await GoogleSignin.hasPlayServices();
			const response = await GoogleSignin.signIn();

			if (response.type === 'success' && response.data?.idToken) {
				const apiResponse = await api.post('/auth/google', { idToken: response.data.idToken });
				await login(apiResponse.data.token, apiResponse.data.user);
				router.replace('/');
			} else if (response.type === 'cancelled') {
				setErrorMessage('Connexion annulée.');
			}
		} catch (error: any) {
			setErrorMessage('Erreur lors de la connexion avec Google.');
			console.error(error);
		}
	};

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		>
			<View style={styles.backgroundContainer}>
				<View style={[styles.bubble, styles.bubblePink]} />
				<View style={[styles.bubble, styles.bubbleBlue]} />
				<View style={styles.noiseOverlay} />
			</View>

			<View style={styles.container}>
				<View style={styles.formContainer}>
					<ThemedText type="title" style={styles.title}>Connexion</ThemedText>

					{errorMessage ? (
						<ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
					) : null}

					<TextInput
						style={styles.input}
						placeholder="Email"
						placeholderTextColor="#8E8E93"
						value={email}
						onChangeText={setEmail}
						autoCapitalize="none"
						keyboardType="email-address"
					/>

					<TextInput
						style={styles.input}
						placeholder="Mot de passe"
						placeholderTextColor="#8E8E93"
						value={password}
						onChangeText={setPassword}
						secureTextEntry
					/>

					<Pressable
						style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
						onPress={handleLogin}
					>
						<ThemedText style={styles.primaryButtonText}>Se connecter</ThemedText>
					</Pressable>

					<View style={styles.separatorContainer}>
						<View style={styles.separatorLine} />
						<ThemedText style={styles.separatorText}>OU</ThemedText>
						<View style={styles.separatorLine} />
					</View>

					<Pressable
						style={({ pressed }) => [styles.googleButton, pressed && styles.buttonPressed]}
						onPress={handleGoogleLogin}
					>
						<AntDesign name="google" size={20} color="#DB4437" style={styles.googleIcon} />
						<ThemedText style={styles.googleButtonText}>Se connecter avec Google</ThemedText>
					</Pressable>

					<View style={styles.footerLinks}>
						<Link href="/register" asChild>
							<Pressable>
								<ThemedText style={styles.linkText}>Créer un compte</ThemedText>
							</Pressable>
						</Link>

						<Link href="/forgot-password" asChild>
							<Pressable>
								<ThemedText style={styles.linkTextSecondary}>Mot de passe oublié ?</ThemedText>
							</Pressable>
						</Link>
					</View>
				</View>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	backgroundContainer: {
		...StyleSheet.absoluteFill,
		backgroundColor: '#FFFFFF',
		overflow: 'hidden',
	},
	bubble: {
		position: 'absolute',
		borderRadius: 999,
		opacity: 0.4,
	},
	bubblePink: {
		width: 300,
		height: 300,
		backgroundColor: '#FF69B4',
		top: -100,
		left: -100,
	},
	bubbleBlue: {
		width: 350,
		height: 350,
		backgroundColor: '#007AFF',
		bottom: -150,
		right: -100,
	},
	noiseOverlay: {
		...StyleSheet.absoluteFill,
		backgroundColor: 'rgba(255, 255, 255, 0.6)',
	},
	container: {
		flex: 1,
		justifyContent: 'center',
		padding: 24,
	},
	formContainer: {
		backgroundColor: 'rgba(255, 255, 255, 0.85)',
		padding: 24,
		borderRadius: 24,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.1,
		shadowRadius: 20,
		elevation: 5,
	},
	title: {
		fontSize: 32,
		fontWeight: '700',
		color: '#1C1C1E',
		marginBottom: 32,
		textAlign: 'center',
	},
	errorText: {
		color: '#FF3B30',
		marginBottom: 16,
		textAlign: 'center',
		fontWeight: '600',
		fontSize: 14,
	},
	input: {
		height: 52,
		backgroundColor: '#F2F2F7',
		borderRadius: 14,
		paddingHorizontal: 16,
		fontSize: 16,
		color: '#1C1C1E',
		marginBottom: 16,
	},
	primaryButton: {
		backgroundColor: '#007AFF',
		height: 52,
		borderRadius: 14,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 8,
		shadowColor: '#007AFF',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 3,
	},
	primaryButtonText: {
		color: '#FFFFFF',
		fontSize: 17,
		fontWeight: '600',
	},
	buttonPressed: {
		opacity: 0.7,
		transform: [{ scale: 0.98 }],
	},
	separatorContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 24,
	},
	separatorLine: {
		flex: 1,
		height: 1,
		backgroundColor: '#E5E5EA',
	},
	separatorText: {
		marginHorizontal: 12,
		color: '#8E8E93',
		fontSize: 14,
		fontWeight: '500',
	},
	googleButton: {
		flexDirection: 'row',
		backgroundColor: '#FFFFFF',
		height: 52,
		borderRadius: 14,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#E5E5EA',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 1,
	},
	googleIcon: {
		marginRight: 10,
	},
	googleButtonText: {
		color: '#1C1C1E',
		fontSize: 16,
		fontWeight: '600',
	},
	footerLinks: {
		marginTop: 32,
		alignItems: 'center',
		gap: 16,
	},
	linkText: {
		color: '#007AFF',
		fontSize: 16,
		fontWeight: '600',
	},
	linkTextSecondary: {
		color: '#8E8E93',
		fontSize: 14,
		fontWeight: '500',
	},
});
