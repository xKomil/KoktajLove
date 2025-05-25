// frontend/src/services/authService.ts
import apiClient from './apiClient';
import { LoginCredentials, RegisterData, User, TokenResponse, UserUpdate, PasswordChangeData } from '@/types/authTypes';

interface LoginApiResponse {
  access_token: string;
  token_type: string;
}

interface OAuth2LoginData {
  username: string;
  password: string;
  grant_type?: string;
  scope?: string;
}

export const loginUser = async (credentials: LoginCredentials): Promise<{ token: string; user: User }> => {
  const formData = new URLSearchParams();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);

  const response = await apiClient.post<LoginApiResponse>(
    '/auth/login',
    formData,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  const token = response.data.access_token;
  const loggedInUser = await getCurrentUser(token);

  return { token, user: loggedInUser };
};

/**
 * Registers a new user.
 * @param data - The user's registration data (email, password, username).
 * @returns A promise that resolves to the created user's data (excluding sensitive info).
 */
export const registerUser = async (data: RegisterData): Promise<User> => {
  const response = await apiClient.post<User>('/auth/register', data);
  return response.data;
};

/**
 * Fetches the current authenticated user's data.
 * @param token - Optional token, if we want to pass it explicitly
 * @returns A promise that resolves to the current user's data.
 */
export const getCurrentUser = async (token?: string): Promise<User> => {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  try {
    const response = await apiClient.get<User>('/users/me', config);
    return response.data;
  } catch (error: any) {
    console.error("Błąd podczas getCurrentUser:", error);
    if (error.response && error.response.data) {
      console.error("Odpowiedź błędu z serwera (getCurrentUser), error.response.data:", error.response.data);
    }
    throw error;
  }
};

/**
 * Updates the current user's profile information.
 * @param data - The profile data to update
 * @returns A promise that resolves to the updated user data
 */
export const updateUserProfile = async (data: UserUpdate): Promise<User> => {
  try {
    const response = await apiClient.put<User>('/users/me', data);
    return response.data;
  } catch (error: any) {
    console.error("Błąd podczas updateUserProfile:", error);
    if (error.response && error.response.data) {
      console.error("Odpowiedź błędu z serwera (updateUserProfile):", error.response.data);
    }
    throw error;
  }
};

/**
 * Changes the current user's password.
 * @param data - Current and new password data
 * @returns A promise that resolves when password is successfully changed
 */
export const changePassword = async (data: PasswordChangeData): Promise<void> => {
  try {
    await apiClient.put('/users/me', {
      current_password: data.current_password,
      new_password: data.new_password
    });
  } catch (error: any) {
    console.error("Błąd podczas changePassword:", error);
    if (error.response && error.response.data) {
      console.error("Odpowiedź błędu z serwera (changePassword):", error.response.data);
    }
    throw error;
  }
};

/**
 * (Optional) Refreshes the JWT token if your backend supports it.
 * @param refreshToken - The refresh token.
 * @returns A promise that resolves to the new token data.
 */
export const refreshToken = async (/* refreshToken: string */): Promise<TokenResponse> => {
  throw new Error('Refresh token functionality not implemented yet.');
};