// frontend/src/services/cocktailService.ts
import apiClient from './apiClient';
import { 
  CocktailWithDetails, 
  CocktailCreate, 
  CocktailUpdate,
  PaginatedResponse // If using pagination
} from '@/types/cocktailTypes';
import { CommonQueryPaginationParams } from '@/types/commonTypes';


// Define a type for filter parameters if you have them
export interface CocktailFilters extends CommonQueryPaginationParams {
  name?: string;
  tag_ids?: number[];
  ingredient_ids?: number[];
  owner_id?: number;
  is_public?: boolean;
  // Add other filterable fields as needed
}

/**
 * Fetches a list of cocktails, optionally with filters and pagination.
 * @param params - Optional filter and pagination parameters.
 * @returns A promise that resolves to an array of cocktails or a paginated response.
 */
export const getCocktails = async (params?: CocktailFilters): Promise<CocktailWithDetails[] | PaginatedResponse<CocktailWithDetails>> => {
  // If your backend returns a simple array:
  // const response = await apiClient.get<CocktailWithDetails[]>('/cocktails/', { params });
  // return response.data;

  // If your backend returns a paginated structure:
  const response = await apiClient.get<PaginatedResponse<CocktailWithDetails>>('/cocktails/', { params });
  // If the backend doesn't always return PaginatedResponse (e.g. for non-paginated filters)
  // you might need to check the response structure or always expect one type.
  // For now, assuming it might be one or the other based on params.
  // A more robust way is to always expect PaginatedResponse and extract items.
  // Example: return response.data.items if always paginated.
  // For now, this example assumes it could be either.
  if ('items' in response.data && 'total' in response.data) {
    return response.data as PaginatedResponse<CocktailWithDetails>;
  }
  return response.data as CocktailWithDetails[]; // Fallback if not clearly paginated by structure
};

/**
 * Fetches a single cocktail by its ID.
 * @param id - The ID of the cocktail.
 * @returns A promise that resolves to the cocktail details.
 */
export const getCocktailById = async (id: number | string): Promise<CocktailWithDetails> => {
  const response = await apiClient.get<CocktailWithDetails>(`/cocktails/${id}`);
  return response.data;
};

/**
 * Creates a new cocktail.
 * @param data - The data for the new cocktail.
 * @returns A promise that resolves to the created cocktail details.
 */
export const createCocktail = async (data: CocktailCreate): Promise<CocktailWithDetails> => {
  const response = await apiClient.post<CocktailWithDetails>('/cocktails/', data);
  return response.data;
};

/**
 * Updates an existing cocktail.
 * @param id - The ID of the cocktail to update.
 * @param data - The data to update the cocktail with.
 * @returns A promise that resolves to the updated cocktail details.
 */
export const updateCocktail = async (id: number | string, data: CocktailUpdate): Promise<CocktailWithDetails> => {
  const response = await apiClient.put<CocktailWithDetails>(`/cocktails/${id}`, data);
  return response.data;
};

/**
 * Deletes a cocktail.
 * @param id - The ID of the cocktail to delete.
 * @returns A promise that resolves when the cocktail is deleted.
 */
export const deleteCocktail = async (id: number | string): Promise<void> => {
  await apiClient.delete(`/cocktails/${id}`);
};

// Add other cocktail-related service functions as needed, e.g.:
// - searchCocktails
// - getCocktailsByTags
// - getCocktailsByIngredients