import { create } from 'zustand';
import { api } from '../services/api';
import { storage } from '../utils/storage';
import { AuthUser, AuthTokens } from '@musicroom/shared';

interface AuthState {
	user: AuthUser | null;
	accessToken: string | null;
	isLoading: boolean;
	login: (tokens: AuthTokens, user: AuthUser) => Promise<void>;
	logout: () => Promise<void>;
	checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	accessToken: null,
	isLoading: true,

	login: async (tokens: AuthTokens, user: AuthUser) => {
		await storage.setItemAsync('accessToken', tokens.accessToken);
		await storage.setItemAsync('refreshToken', tokens.refreshToken);
		set({ accessToken: tokens.accessToken, user, isLoading: false });
	},

	logout: async () => {
		const refreshToken = await storage.getItemAsync('refreshToken');
		if (refreshToken) {
			try {
				await api.post('/auth/logout', { refreshToken });
			} catch (error) {
			}
		}
		await storage.deleteItemAsync('accessToken');
		await storage.deleteItemAsync('refreshToken');
		set({ accessToken: null, user: null, isLoading: false });
	},

	checkAuth: async () => {
		try {
			const accessToken = await storage.getItemAsync('accessToken');
			if (accessToken) {
				const response = await api.get<{ message: string; userId: string }>('/protected');
				set({ 
					accessToken, 
					user: { id: response.data.userId, email: '', isEmailValidated: true }, 
					isLoading: false 
				});
			} else {
				set({ isLoading: false });
			}
		} catch (error) {
			await storage.deleteItemAsync('accessToken');
			await storage.deleteItemAsync('refreshToken');
			set({ accessToken: null, user: null, isLoading: false });
		}
	},
}));
