// frontend/src/services/ratingService.ts
import apiClient from './apiClient';
import { Rating, RatingCreate, RatingUpdate } from '@/types/cocktailTypes'; // Assuming Rating types are in cocktailTypes

/**
 * Submits or updates a rating for a cocktail.
 * @param cocktailId - The ID of the cocktail being rated.
 * @param score - The rating score (e.g., 1-5).
 * @returns A promise that resolves to the created or updated rating.
 */
export const rateCocktail = async (cocktailId: number | string, score: number): Promise<Rating> => {
  // The backend might use a POST to /cocktails/{cocktailId}/ratings or a general /ratings endpoint.
  // Adjust the endpoint and payload (RatingCreate) as needed.
  const payload: RatingCreate = { score, cocktail_id: Number(cocktailId) }; // cocktail_id might be implicit from URL
  const response = await apiClient.post<Rating>(`/cocktails/${cocktailId}/rate`, payload);
  return response.data;
};

/**
 * Fetches all ratings for a specific cocktail.
 * @param cocktailId - The ID of the cocktail.
 * @returns A promise that resolves to an array of ratings for the cocktail.
 */
export const getRatingsForCocktail = async (cocktailId: number | string): Promise<Rating[]> => {
  const response = await apiClient.get<Rating[]>(`/cocktails/${cocktailId}/ratings`);
  return response.data;
};

/**
 * Fetches a specific rating by its ID (if ratings have their own IDs and endpoint).
 * @param ratingId - The ID of the rating.
 * @returns A promise that resolves to the rating details.
 */
export const getRatingById = async (ratingId: number | string): Promise<Rating> => {
  const response = await apiClient.get<Rating>(`/ratings/${ratingId}`); // Example endpoint
  return response.data;
};

/**
 * Updates an existing rating.
 * @param ratingId - The ID of the rating to update.
 *   (Or cocktailId if user can only have one rating per cocktail, then use rateCocktail/PUT)
 * @param data - The data to update the rating with (e.g., new score).
 * @returns A promise that resolves to the updated rating.
 */
export const updateRating = async (ratingId: number | string, data: RatingUpdate): Promise<Rating> => {
  const response = await apiClient.put<Rating>(`/ratings/${ratingId}`, data); // Example endpoint
  return response.data;
};

/**
 * Deletes a rating.
 * @param ratingId - The ID of the rating to delete.
 *   (Or cocktailId if user wants to remove their rating for a cocktail)
 * @returns A promise that resolves when the rating is deleted.
 */
export const deleteRating = async (ratingId: number | string): Promise<void> => {
  await apiClient.delete(`/ratings/${ratingId}`); // Example endpoint
};

/**
 * Fetches the rating given by a specific user for a specific cocktail.
 * @param userId - The ID of the user.
 * @param cocktailId - The ID of the cocktail.
 * @returns A promise that resolves to the user's rating for that cocktail, or null/error if not found.
 */
export const getUserRatingForCocktail = async (userId: number | string, cocktailId: number | string): Promise<Rating | null> => {
  try {
    const response = await apiClient.get<Rating | null>(`/ratings/user-cocktail-rating/`, {
      params: { // Przekazujemy jako parametry zapytania
        user_id: userId,
        cocktail_id: cocktailId
      }
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return null; // No rating found for this user and cocktail
    }
    throw error; // Re-throw other errors
  }
};