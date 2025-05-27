// frontend/src/services/userService.ts
import apiClient from './apiClient';
import { User, UserUpdate } from '@/types/authTypes'; // Assuming User type is in authTypes
import { CocktailWithDetails } from '@/types/cocktailTypes';
import { CommonQueryPaginationParams, PaginatedResponse } from '@/types/commonTypes';

export interface UserFilters extends CommonQueryPaginationParams {
  username?: string;
  email?: string;
  // Add other filterable fields as needed
}

/**
 * Fetches a list of users. (Typically an admin-only action)
 * @param params - Optional filter and pagination parameters.
 * @returns A promise that resolves to an array of users or a paginated response.
 */
export const getUsers = async (params?: UserFilters): Promise<User[] | PaginatedResponse<User>> => {
  const response = await apiClient.get<User[] | PaginatedResponse<User>>('/users/', { params });
  if ('items' in response.data && 'total' in response.data) {
    return response.data as PaginatedResponse<User>;
  }
  return response.data as User[];
};

/**
 * Fetches a single user by their ID.
 * @param userId - The ID of the user.
 * @returns A promise that resolves to the user's data.
 */
export const getUserById = async (userId: number | string): Promise<User> => {
  const response = await apiClient.get<User>(`/users/${userId}`);
  return response.data;
};

/**
 * Updates a user's profile.
 * The current authenticated user can update their own profile using '/users/me'.
 * An admin might update any user via '/users/{userId}'.
 * @param userId - The ID of the user to update, or 'me' for the current user.
 * @param data - The data to update the user profile with.
 * @returns A promise that resolves to the updated user data.
 */
export const updateUser = async (userId: number | string, data: UserUpdate): Promise<User> => {
  const endpoint = userId === 'me' ? '/users/me' : `/users/${userId}`;
  const response = await apiClient.put<User>(endpoint, data);
  return response.data;
};

/**
 * Deletes a user. (Typically an admin-only action, or user deleting their own account)
 * @param userId - The ID of the user to delete.
 * @returns A promise that resolves when the user is deleted.
 */
export const deleteUser = async (userId: number | string): Promise<void> => {
  // Endpoint for deleting own account might be different, e.g., /users/me
  await apiClient.delete(`/users/${userId}`);
};

/**
 * Fetches cocktails created by a specific user.
 * @param userId - The ID of the user.
 * @param params - Optional pagination/filter parameters for the cocktails.
 * @returns A promise that resolves to an array or paginated response of cocktails.
 */
export const getUserCocktails = async (
    userId: number | string,
    params?: CommonQueryPaginationParams /* Add specific cocktail filters if needed */
  ): Promise<CocktailWithDetails[] | PaginatedResponse<CocktailWithDetails>> => {
    const response = await apiClient.get<CocktailWithDetails[] | PaginatedResponse<CocktailWithDetails>>(
      `/users/${userId}/cocktails`, 
      { params }
    );
    // Adapt based on whether your API always returns paginated or simple array
    if ('items' in response.data && 'total' in response.data) {
      return response.data as PaginatedResponse<CocktailWithDetails>;
    }
    return response.data as CocktailWithDetails[];
  };

// Other user-specific actions like:
// - Change password
// - Request password reset
// - Verify email
// should be added here as needed.