// frontend/src/services/tagService.ts
import apiClient from './apiClient';
import { Tag, TagCreate, TagUpdate, PaginatedResponse } from '@/types/cocktailTypes'; // Assuming Tag types are in cocktailTypes
import { CommonQueryPaginationParams } from '@/types/commonTypes';

export interface TagFilters extends CommonQueryPaginationParams {
  name?: string;
  // Add other filterable fields as needed
}

/**
 * Fetches a list of tags.
 * @param params - Optional filter and pagination parameters.
 * @returns A promise that resolves to an array of tags or a paginated response.
 */
export const getTags = async (params?: TagFilters): Promise<Tag[] | PaginatedResponse<Tag>> => {
  const response = await apiClient.get<Tag[] | PaginatedResponse<Tag>>('/tags/', { params });
  if ('items' in response.data && 'total' in response.data) {
    return response.data as PaginatedResponse<Tag>;
  }
  return response.data as Tag[];
};

/**
 * Fetches a single tag by its ID.
 * @param id - The ID of the tag.
 * @returns A promise that resolves to the tag details.
 */
export const getTagById = async (id: number | string): Promise<Tag> => {
  const response = await apiClient.get<Tag>(`/tags/${id}`);
  return response.data;
};

/**
 * Creates a new tag. (Primarily for admin users or if users can create tags)
 * @param data - The data for the new tag.
 * @returns A promise that resolves to the created tag.
 */
export const createTag = async (data: TagCreate): Promise<Tag> => {
  const response = await apiClient.post<Tag>('/tags/', data);
  return response.data;
};

/**
 * Updates an existing tag. (Primarily for admin users)
 * @param id - The ID of the tag to update.
 * @param data - The data to update the tag with.
 * @returns A promise that resolves to the updated tag.
 */
export const updateTag = async (id: number | string, data: TagUpdate): Promise<Tag> => {
  const response = await apiClient.put<Tag>(`/tags/${id}`, data);
  return response.data;
};

/**
 * Deletes a tag. (Primarily for admin users)
 * @param id - The ID of the tag to delete.
 * @returns A promise that resolves when the tag is deleted.
 */
export const deleteTag = async (id: number | string): Promise<void> => {
  await apiClient.delete(`/tags/${id}`);
};