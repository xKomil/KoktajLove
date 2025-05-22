// frontend/src/services/authService.ts
import apiClient from './apiClient';
import { LoginCredentials, RegisterData, User, TokenResponse } from '@/types/authTypes';

interface LoginApiResponse { // Zmień na rzeczywistą odpowiedź z twojego backendu
  access_token: string;
  token_type: string;
  // user?: User; // Czy backend zwraca usera przy logowaniu w tym samym endpoincie?
                 // Zgodnie z twoim auth.py, endpoint /login zwraca tylko schemas.Token,
                 // więc User musiałby być pobrany osobno przez /me.
}

// Interfejs dla danych, które faktycznie wysyłamy do endpointu /login
// który oczekuje OAuth2PasswordRequestForm
interface OAuth2LoginData {
  username: string;
  password: string;
  grant_type?: string; // opcjonalne
  scope?: string;      // opcjonalne
  // client_id i client_secret, jeśli są potrzebne
}

export const loginUser = async (credentials: LoginCredentials): Promise<{ token: string; user: User }> => {
  // Przygotuj dane w formacie x-www-form-urlencoded
  const formData = new URLSearchParams();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);
  // formData.append('grant_type', 'password'); // Możesz dodać, jeśli backend tego wymaga jawnie

  const response = await apiClient.post<LoginApiResponse>(
    '/auth/login',
    formData, // Wysyłamy obiekt URLSearchParams
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded', // Jawnie ustawiamy nagłówek
      },
    }
  );

  // UWAGA: Twój backendowy endpoint /login zwraca tylko token (schemas.Token).
  // Aby uzyskać dane użytkownika, musisz wywołać endpoint /me po udanym logowaniu.
  const token = response.data.access_token;

  // Po uzyskaniu tokenu, pobierz dane użytkownika
  // Upewnij się, że apiClient automatycznie dodaje nowy token do nagłówków kolejnych żądań
  // (co powinien robić, jeśli interceptor jest dobrze skonfigurowany i AuthContext aktualizuje token w localStorage)
  const loggedInUser = await getCurrentUser(token); // Potrzebujemy funkcji getCurrentUser z tokenem

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
 * @param token - Opcjonalny token, jeśli chcemy go przekazać jawnie
 *                (apiClient powinien go sam wziąć z localStorage, jeśli tam jest)
 * @returns A promise that resolves to the current user's data.
 */
export const getCurrentUser = async (token?: string): Promise<User> => {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  try {
    const response = await apiClient.get<User>('/users/me', config);
    return response.data;
  } catch (error: any) {
    console.error("Błąd podczas getCurrentUser:", error); // Cały obiekt błędu
    if (error.response && error.response.data) { // Sprawdź czy error.response.data istnieje
      console.error("Odpowiedź błędu z serwera (getCurrentUser), error.response.data:", error.response.data); // <--- TO JEST KLUCZOWE
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
  // This is a placeholder. Your backend might have a different endpoint or mechanism.
  // const response = await apiClient.post<TokenResponse>('/auth/refresh-token', { refresh_token: refreshToken });
  // return response.data;
  throw new Error('Refresh token functionality not implemented yet.');
};