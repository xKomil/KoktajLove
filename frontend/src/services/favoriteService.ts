// frontend/src/services/favoriteService.ts
import apiClient from './apiClient'; // Upewnij się, że apiClient jest poprawnie skonfigurowany
import { CocktailWithDetails } from '@/types/cocktailTypes'; // Zakładam, że ten typ jest potrzebny dla getFavoriteCocktails

// === POCZĄTEK UZUPEŁNIENIA ===
// Typ dla odpowiedzi sprawdzania statusu ulubionego
// Musi pasować do schematu Pydantic FavoriteStatusResponse w backendzie
export interface FavoriteStatusResponse {
  is_favorite: boolean;
  cocktail_id: number; // Backend zwraca cocktail_id, więc uwzględniamy to w typie
}
// === KONIEC UZUPEŁNIENIA ===

/**
 * Fetches the list of favorite cocktails with full details for the currently authenticated user.
 * @returns A promise that resolves to an array of favorite cocktails with details.
 */
export const getFavoriteCocktails = async (): Promise<CocktailWithDetails[]> => {
  // Ścieżka powinna pasować do backendowego endpointu zwracającego PEŁNE dane koktajli,
  // czyli /favorites/my-favorites/cocktails
  const response = await apiClient.get<CocktailWithDetails[]>('/favorites/my-favorites/cocktails');
  return response.data;
};

/**
 * Adds a cocktail to the user's favorites.
 * @param cocktailId - The ID of the cocktail to add.
 * @returns A promise that resolves to the favorite object (lub cokolwiek zwraca API).
 */
export const addCocktailToFavorites = async (cocktailId: number | string): Promise<any> => { // Możesz użyć dokładniejszego typu niż 'any'
  // Endpoint POST /favorites/ oczekuje ciała { "cocktail_id": number }
  const response = await apiClient.post(`/favorites/`, { cocktail_id: Number(cocktailId) });
  return response.data;
};

/**
 * Removes a cocktail from the user's favorites.
 * @param cocktailId - The ID of the cocktail to remove.
 * @returns A promise that resolves when the cocktail is removed.
 */
export const removeCocktailFromFavorites = async (cocktailId: number | string): Promise<void> => {
  // Endpoint DELETE /favorites/{cocktail_id}
  await apiClient.delete(`/favorites/${cocktailId}`);
};

/**
 * Checks if a specific cocktail is in the user's favorites.
 * @param cocktailId - The ID of the cocktail to check.
 * @returns A promise that resolves to an object indicating favorite status.
 */
export const isCocktailFavorite = async (cocktailId: number | string): Promise<FavoriteStatusResponse> => {
    // Używamy nowego endpointu GET /favorites/cocktail/{cocktail_id}/status
    try {
        const response = await apiClient.get<FavoriteStatusResponse>(`/favorites/cocktail/${cocktailId}/status`);
        return response.data;
    } catch (error: any) {
        // Logowanie błędu jest ważne
        console.warn(`Failed to check favorite status for cocktail ${cocktailId}:`, error);

        // Jeśli backend zwróci 404 (np. koktajl nie istnieje lub endpoint nie znaleziony dla tego koktajlu),
        // traktujemy to jako "nie jest ulubiony".
        // W innych przypadkach (np. błąd sieci, błąd serwera 500) rzucamy błąd dalej,
        // aby komponent mógł go obsłużyć (np. wyświetlić komunikat o błędzie).
        if (error.response && error.response.status === 404) {
            return { is_favorite: false, cocktail_id: Number(cocktailId) };
        }
        // Jeśli to nie jest 404, rzuć błąd dalej, aby np. CocktailCard mógł wyświetlić favoriteError
        throw error;
    }
};