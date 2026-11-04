import axios from 'axios';
import { storage } from '../utils/storage';

export const api = axios.create({
	baseURL: process.env.EXPO_PUBLIC_API_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

api.interceptors.request.use(async (config) => {
	const token = await storage.getItemAsync('jwt_token');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});
