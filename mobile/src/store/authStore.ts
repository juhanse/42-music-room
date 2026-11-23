import { create } from 'zustand';
import { api } from '../services/api';
import { storage } from '../utils/storage';
import { AuthUser, AuthTokens, SubscriptionPlan } from '@musicroom/shared';

interface AuthState {
	user: AuthUser | null;
	accessToken: string | null;
	isLoading: boolean;
	login: (tokens: AuthTokens, user: AuthUser) => Promise<void>;
	logout: () => Promise<void>;
	checkAuth: () => Promise<void>;
	updateProfile: (data: Partial<AuthUser>) => Promise<void>;
	updateSubscription: (plan: SubscriptionPlan) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
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
				const response = await api.get<AuthUser>('/users/me');
				set({ accessToken, user: response.data, isLoading: false });
			} else {
				set({ isLoading: false });
			}
		} catch (error) {
			await storage.deleteItemAsync('accessToken');
			await storage.deleteItemAsync('refreshToken');
			set({ accessToken: null, user: null, isLoading: false });
		}
	},

	updateProfile: async (data: Partial<AuthUser>) => {
		try {
			const response = await api.patch<{ message: string, user: AuthUser }>('/users/me/profile', data);
			set({ user: response.data.user });
		} catch (error) {
			console.error(error);
			throw error;
		}
	},

	updateSubscription: async (plan: SubscriptionPlan) => {
		try {
			await api.post('/users/me/subscription', { plan });
			const currentUser = get().user;
			if (currentUser) {
				set({ user: { ...currentUser, subscriptionPlan: plan } });
			}
		} catch (error) {
			console.error(error);
			throw error;
		}
	},
}));
