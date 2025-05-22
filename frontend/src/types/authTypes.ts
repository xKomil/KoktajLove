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
  profile_picture_url?: string | null; // Optional field
  // Add other fields like first_name, last_name, created_at, etc., as needed
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
  // You might add other fields like first_name, last_name if they are part of registration
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
export type UserUpdate = Partial<Omit<User, 'id' | 'is_active' | 'is_superuser' | 'email' >> & {
  // Email might be updatable but often requires a separate verification process.
  // Password updates should usually go through a dedicated "change password" endpoint.
  email?: string; 
  // current_password?: string; // Often required for sensitive changes like email or password
  // new_password?: string;
};

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