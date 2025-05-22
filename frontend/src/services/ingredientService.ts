// frontend/src/services/ingredientService.ts
import apiClient from './apiClient';
import { Ingredient, IngredientCreate, IngredientUpdate, PaginatedResponse } from '@/types/cocktailTypes'; // Assuming Ingredient types are in cocktailTypes
import { CommonQueryPaginationParams } from '@/types/commonTypes';


export interface IngredientFilters extends CommonQueryPaginationParams {
  name?: string;
  // Add other filterable fields as needed
}
/**
 * Fetches a list of ingredients.
 * @param params - Optional filter and pagination parameters.
 * @returns A promise that resolves to an array of ingredients or a paginated response.
 */
export const getIngredients = async (params?: IngredientFilters): Promise<Ingredient[] | PaginatedResponse<Ingredient>> => {
  const response = await apiClient.get<Ingredient[] | PaginatedResponse<Ingredient>>('/ingredients/', { params });
  // Similar to cocktailService, adapt based on whether your API always returns paginated or simple array
  if ('items' in response.data && 'total' in response.data) {
    return response.data as PaginatedResponse<Ingredient>;
  }
  return response.data as Ingredient[];
};

/**
 * Fetches a single ingredient by its ID.
 * @param id - The ID of the ingredient.
 * @returns A promise that resolves to the ingredient details.
 */
export const getIngredientById = async (id: number | string): Promise<Ingredient> => {
  const response = await apiClient.get<Ingredient>(`/ingredients/${id}`);
  return response.data;
};

/**
 * Creates a new ingredient. (Primarily for admin users)
 * @param data - The data for the new ingredient.
 * @returns A promise that resolves to the created ingredient.
 */
export const createIngredient = async (data: IngredientCreate): Promise<Ingredient> => {
  const response = await apiClient.post<Ingredient>('/ingredients/', data);
  return response.data;
};

/**
 * Updates an existing ingredient. (Primarily for admin users)
 * @param id - The ID of the ingredient to update.
 * @param data - The data to update the ingredient with.
 * @returns A promise that resolves to the updated ingredient.
 */
export const updateIngredient = async (id: number | string, data: IngredientUpdate): Promise<Ingredient> => {
  const response = await apiClient.put<Ingredient>(`/ingredients/${id}`, data);
  return response.data;
};

/**
 * Deletes an ingredient. (Primarily for admin users)
 * @param id - The ID of the ingredient to delete.
 * @returns A promise that resolves when the ingredient is deleted.
 */
export const deleteIngredient = async (id: number | string): Promise<void> => {
  await apiClient.delete(`/ingredients/${id}`);
};