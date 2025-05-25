// frontend/src/services/ratingService.ts
import apiClient from './apiClient';
import { Rating, RatingCreate, RatingUpdate } from '@/types/cocktailTypes';

/**
 * Tworzy nową ocenę dla koktajlu.
 * @param data - Dane do utworzenia oceny (score to rating_value w backend)
 * @returns Promise z utworzoną oceną
 */
export const createRating = async (data: { 
  cocktail_id: number; 
  score: number; 
  comment?: string 
}): Promise<Rating> => {
  const payload: RatingCreate = {
    cocktail_id: data.cocktail_id,
    rating_value: data.score, // Mapowanie z frontend 'score' na backend 'rating_value'
    comment: data.comment
  };

  const response = await apiClient.post<Rating>('/ratings/', payload);
  return response.data;
};

/**
 * Pobiera ocenę danego użytkownika dla konkretnego koktajlu.
 * Używa endpointu /user-cocktail-rating/ z query params.
 * @param cocktailId - ID koktajlu
 * @param userId - ID użytkownika (opcjonalne, może być pobierane z tokena)
 * @returns Promise z oceną użytkownika lub null jeśli nie istnieje
 */
export const getUserRatingForCocktail = async (
  cocktailId: number, 
  userId?: number
): Promise<Rating | null> => {
  try {
    const params: any = { cocktail_id: cocktailId };
    
    // Jeśli userId zostało przekazane, dodaj je do parametrów
    // W przeciwnym razie backend użyje current_user z tokena
    if (userId !== undefined) {
      params.user_id = userId;
    }

    const response = await apiClient.get<Rating | null>('/ratings/user-cocktail-rating/', {
      params
    });

    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return null; // Brak oceny dla tego użytkownika i koktajlu
    }
    throw error; // Rzuć dalej inne błędy
  }
};

/**
 * Aktualizuje istniejącą ocenę (używając jej ID).
 * @param ratingId - ID oceny do aktualizacji
 * @param data - Dane do aktualizacji (score i/lub comment)
 * @returns Promise z zaktualizowaną oceną
 */
export const updateRating = async (
  ratingId: number, 
  data: { score?: number; comment?: string }
): Promise<Rating> => {
  const payload: RatingUpdate = {};
  
  // Mapowanie z frontend 'score' na backend 'rating_value'
  if (data.score !== undefined) {
    payload.rating_value = data.score;
  }
  
  if (data.comment !== undefined) {
    payload.comment = data.comment;
  }

  const response = await apiClient.put<Rating>(`/ratings/${ratingId}`, payload);
  return response.data;
};

/**
 * Usuwa ocenę.
 * @param ratingId - ID oceny do usunięcia
 * @returns Promise<void>
 */
export const deleteRating = async (ratingId: number): Promise<void> => {
  await apiClient.delete(`/ratings/${ratingId}`);
};

/**
 * Pobiera wszystkie oceny dla danego koktajlu.
 * @param cocktailId - ID koktajlu
 * @param params - Opcjonalne parametry paginacji
 * @returns Promise z listą ocen dla koktajlu
 */
export const getRatingsForCocktail = async (
  cocktailId: number, 
  params?: { skip?: number; limit?: number }
): Promise<Rating[]> => {
  const queryParams = {
    skip: params?.skip || 0,
    limit: params?.limit || 10
  };

  const response = await apiClient.get<Rating[]>(`/ratings/cocktail/${cocktailId}`, {
    params: queryParams
  });
  
  return response.data;
};

/**
 * DODATKOWO: Pobiera konkretną ocenę po ID (jeśli potrzebne)
 * @param ratingId - ID oceny
 * @returns Promise z oceną
 */
export const getRatingById = async (ratingId: number): Promise<Rating> => {
  const response = await apiClient.get<Rating>(`/ratings/${ratingId}`);
  return response.data;
};