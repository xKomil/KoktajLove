// frontend/src/services/favoriteService.ts
import apiClient from './apiClient';
import { CocktailWithDetails } from '@/types/cocktailTypes';
import { User } from '@/types/authTypes'; // If needed for specific user favorites

interface FavoriteStatusResponse {
  is_favorite: boolean;
  cocktail_id: number;
  // user_id might also be part of the response
}

/**
 * Fetches the list of favorite cocktails for the currently authenticated user.
 * @returns A promise that resolves to an array of favorite cocktails.
 */
export const getFavoriteCocktails = async (): Promise<CocktailWithDetails[]> => {
  // Endpoint might be /users/me/favorites or /favorites/
  const response = await apiClient.get<CocktailWithDetails[]>('/users/me/favorites'); 
  return response.data;
};

/**
 * Adds a cocktail to the user's favorites.
 * @param cocktailId - The ID of the cocktail to add.
 * @returns A promise that resolves when the cocktail is added (response might be minimal or the favorite entry).
 */
export const addCocktailToFavorites = async (cocktailId: number | string): Promise<any> => {
  // Endpoint might be /cocktails/{cocktailId}/favorite or /favorites/
  const response = await apiClient.post(`/cocktails/${cocktailId}/favorite`);
  return response.data; // Or handle as void if no meaningful data returned
};

/**
 * Removes a cocktail from the user's favorites.
 * @param cocktailId - The ID of the cocktail to remove.
 * @returns A promise that resolves when the cocktail is removed.
 */
export const removeCocktailFromFavorites = async (cocktailId: number | string): Promise<void> => {
  await apiClient.delete(`/cocktails/${cocktailId}/favorite`);
};

/**
 * Checks if a specific cocktail is in the user's favorites.
 * @param cocktailId - The ID of the cocktail to check.
 * @returns A promise that resolves to an object indicating favorite status.
 */
export const isCocktailFavorite = async (cocktailId: number | string): Promise<FavoriteStatusResponse> => {
    const response = await apiClient.get<FavoriteStatusResponse>(`/cocktails/${cocktailId}/is-favorite`);
    return response.data;
};

// If you need to manage favorites for a specific user (e.g., admin viewing another user's favorites)
// you might have functions like:
// export const getUserFavorites = async (userId: number | string): Promise<CocktailWithDetails[]> => {
//   const response = await apiClient.get<CocktailWithDetails[]>(`/users/${userId}/favorites`);
//   return response.data;
// };