// frontend/src/types/favoriteTypes.ts

export interface FavoriteResponse {
  is_favorite: boolean;
}

export interface FavoriteCocktail {
  id: number;
  name: string;
  image_url?: string;
  average_rating?: number;
  ratings_count: number;
} 