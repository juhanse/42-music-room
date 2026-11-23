import axios from 'axios';
import { storage } from '../utils/storage';

export const api = axios.create({
	baseURL: process.env.EXPO_PUBLIC_API_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

api.interceptors.request.use(async (config) => {
	const accessToken = await storage.getItemAsync('accessToken');
	if (accessToken) {
		config.headers.Authorization = `Bearer ${accessToken}`;
	}
	return config;
});

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/refresh')) {
			originalRequest._retry = true;

			try {
				const refreshToken = await storage.getItemAsync('refreshToken');
				if (!refreshToken) {
					throw new Error('No refresh token available');
				}

				const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/auth/refresh`, {
					refreshToken,
				});

				const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;

				await storage.setItemAsync('accessToken', accessToken);
				await storage.setItemAsync('refreshToken', newRefreshToken);

				originalRequest.headers.Authorization = `Bearer ${accessToken}`;
				
				return api(originalRequest);
			} catch (refreshError) {
				await storage.deleteItemAsync('accessToken');
				await storage.deleteItemAsync('refreshToken');
				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	}
);
