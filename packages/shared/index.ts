export interface UserProfile {
    id: string;
    email: string;
    isEmailValidated: boolean;
}

export interface AuthResponse {
    token: string;
    user: UserProfile;
}
