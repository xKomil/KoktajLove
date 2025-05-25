// frontend/src/types/authTypes.ts
/**
 * Represents a user in the system.
 * This should match the Pydantic model returned by your FastAPI backend for user details,
 * excluding sensitive information like hashed_password.
 */
export interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  is_superuser: boolean;
  bio?: string | null;
  avatar_url?: string | null;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  // Deprecated field - keeping for backward compatibility
  profile_picture_url?: string | null;
}

/**
 * Credentials required for user login.
 */
export interface LoginCredentials {
  username: string; // Or email, depending on your backend setup
  password: string;
}

/**
 * Data required for new user registration.
 */
export interface RegisterData {
  email: string;
  password: string;
  username: string;
  bio?: string;
  avatar_url?: string;
}

/**
 * Represents the structure of the token response from the backend's login endpoint.
 * Typically includes the access token and token type.
 */
export interface TokenResponse {
  access_token: string;
  token_type: string; // Usually "bearer"
  // Could also include refresh_token, expires_in, etc.
}

/**
 * Data for updating a user's profile.
 * All fields are optional as it's a partial update.
 */
export interface UserProfileUpdate {
  username?: string;
  email?: string;
  bio?: string;
  avatar_url?: string;
}

/**
 * Data for changing user's password.
 */
export interface PasswordChangeData {
  current_password: string;
  new_password: string;
}

/**
 * Combined update payload that includes both profile and password updates.
 */
export interface UserUpdate extends UserProfileUpdate {
  current_password?: string;
  new_password?: string;
}

/**
 * If you use pagination for listing users (e.g., in an admin panel).
 */
export interface PaginatedUserResponse {
  items: User[];
  total: number;
  page: number;
  size: number;
  pages?: number; // Optional: total number of pages
}