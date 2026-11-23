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

export interface AuthUser {
	id: string;
	email: string;
	isEmailValidated: boolean;
}

export interface AuthResponse {
	user: AuthUser;
	tokens: AuthTokens;
}
