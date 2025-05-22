// frontend/src/services/favoriteService.ts
import apiClient from './apiClient';
import { CocktailWithDetails } from '@/types/cocktailTypes';
// User nie jest tu potrzebny, jeśli getCurrentUser jest w authService
// import { User } from '@/types/authTypes'; 

// Typ dla odpowiedzi /is-favorite (jeśli go używasz, upewnij się, że jest zdefiniowany)
interface FavoriteStatusResponse {
  is_favorite: boolean;
  cocktail_id: number;
}

/**
 * Fetches the list of favorite cocktails with full details for the currently authenticated user.
 * @returns A promise that resolves to an array of favorite cocktails with details.
 */
export const getFavoriteCocktails = async (): Promise<CocktailWithDetails[]> => {
  // Zmień ścieżkę, aby pasowała do backendowego endpointu zwracającego pełne dane
  const response = await apiClient.get<CocktailWithDetails[]>('/favorites/my-favorites/cocktails');
  return response.data;
};

/**
 * Adds a cocktail to the user's favorites.
 * @param cocktailId - The ID of the cocktail to add.
 * @returns A promise that resolves when the cocktail is added.
 */
export const addCocktailToFavorites = async (cocktailId: number | string): Promise<any> => {
  // Ten endpoint prawdopodobnie powinien być pod /favorites/, a nie /cocktails/
  // Zgodnie z twoim favorites.py: @router.post("/") montowany pod /favorites
  // więc powinno być: /favorites/ z ciałem { cocktail_id: ... }
  // LUB jeśli backend ma /cocktails/{id}/favorite, to tak zostaw.
  // Na razie zakładam, że POST /favorites/ jest poprawny
  const response = await apiClient.post(`/favorites/`, { cocktail_id: Number(cocktailId) });
  return response.data;
};

/**
 * Removes a cocktail from the user's favorites.
 * @param cocktailId - The ID of the cocktail to remove.
 * @returns A promise that resolves when the cocktail is removed.
 */
export const removeCocktailFromFavorites = async (cocktailId: number | string): Promise<void> => {
  // Zgodnie z twoim favorites.py: @router.delete("/{cocktail_id}") montowany pod /favorites
  await apiClient.delete(`/favorites/${cocktailId}`);
};

/**
 * Checks if a specific cocktail is in the user's favorites.
 * @param cocktailId - The ID of the cocktail to check.
 * @returns A promise that resolves to an object indicating favorite status.
 */
export const isCocktailFavorite = async (cocktailId: number | string): Promise<FavoriteStatusResponse> => {
    // Zgodnie z sugestią, dodaj endpoint /favorites/cocktail/{cocktail_id}/status
    try {
        const response = await apiClient.get<FavoriteStatusResponse>(`/favorites/cocktail/${cocktailId}/status`);
        return response.data;
    } catch (error: any) {
        console.error("Błąd podczas isCocktailFavorite:", error);
        if (error.response && error.response.status === 404) {
             // Jeśli endpoint nie istnieje lub nie ma informacji, zwróć domyślny status
            return { is_favorite: false, cocktail_id: Number(cocktailId) };
        }
        throw error;
    }
};