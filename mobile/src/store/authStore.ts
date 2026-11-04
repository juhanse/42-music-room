import { create } from 'zustand';
import { api } from '../services/api';
import { storage } from '../utils/storage';
import { UserProfile } from '@musicroom/shared';

interface AuthState {
	user: UserProfile | null;
	token: string | null;
	isLoading: boolean;
	login: (token: string, user: UserProfile) => Promise<void>;
	logout: () => Promise<void>;
	checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	token: null,
	isLoading: true,

	login: async (token: string, user: UserProfile) => {
		await storage.setItemAsync('jwt_token', token);
		set({ token, user, isLoading: false });
	},

	logout: async () => {
		await storage.deleteItemAsync('jwt_token');
		set({ token: null, user: null, isLoading: false });
	},

	checkAuth: async () => {
		try {
			const token = await storage.getItemAsync('jwt_token');
			if (token) {
				const response = await api.get<{ message: string; userId: string }>('/auth/protected');
				set({ token, user: { id: response.data.userId, email: '', isEmailValidated: true }, isLoading: false });
			} else {
				set({ isLoading: false });
			}
		} catch (error) {
			await storage.deleteItemAsync('jwt_token');
			set({ token: null, user: null, isLoading: false });
		}
	},
}));
