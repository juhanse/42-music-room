export type SubscriptionPlan = 'FREE' | 'PREMIUM';

export interface AccessTokenPayload {
	sub: string;
	sid: string;
	iat: number;
	exp: number;
}

export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
}

export interface UserProfileData {
	publicInfo: Record<string, any>;
	friendsInfo: Record<string, any>;
	privateInfo: Record<string, any>;
	musicPreferences: Record<string, any>;
}

export interface AuthUser extends UserProfileData {
	id: string;
	email: string;
	isEmailValidated: boolean;
	subscriptionPlan: SubscriptionPlan;
}

export interface AuthResponse {
	user: AuthUser;
	tokens: AuthTokens;
}
