// frontend/src/types/cocktailTypes.ts

/**
 * Represents an ingredient.
 */
export interface Ingredient {
  id: number;
  name: string;
  description?: string | null;
}

export type IngredientCreate = Omit<Ingredient, 'id'>;
export type IngredientUpdate = Partial<IngredientCreate>;

/**
 * Represents a tag.
 */
export interface Tag {
  id: number;
  name: string;
}

export type TagCreate = Omit<Tag, 'id'>;
export type TagUpdate = Partial<TagCreate>;

/**
 * Enum for units of measurement for ingredients.
 * Should match the enum defined in your FastAPI backend.
 */
export enum UnitEnum {
  ML = "ml",
  L = "l",
  G = "g",
  KG = "kg",
  TSP = "tsp", // teaspoon
  TBSP = "tbsp", // tablespoon
  OZ = "oz",
  SHOT = "shot",
  DASH = "dash",
  PIECE = "piece",
  SLICE = "slice",
  OTHER = "other",
}
/**
 * Data for an ingredient when creating/updating a cocktail (to match backend's CocktailIngredientData).
 */
export interface CocktailIngredientCreateData {
  ingredient_id: number;
  amount: number;
  unit: UnitEnum;
}

/**
 * Data for a tag when creating/updating a cocktail (to match backend's CocktailTagData).
 */
export interface CocktailTagCreateData {
  tag_id: number;
}

/**
 * Base properties for a cocktail.
 */
export interface CocktailBase {
  name: string;
  description: string;
  instructions: string;
  image_url?: string | null;
  is_public: boolean;
}

/**
 * Data structure for creating a new cocktail.
 * This now matches the backend's CocktailCreate schema.
 */
export interface CocktailCreate extends CocktailBase {
  ingredients: CocktailIngredientCreateData[];
  tags: CocktailTagCreateData[];
}

/**
 * Represents an ingredient as part of detailed cocktail information (matches backend's IngredientInCocktailDetail).
 */
export interface CocktailIngredientDetail {
  ingredient: Ingredient;
  amount: number;
  unit: UnitEnum;
}

/**
 * Represents a cocktail with all its details, including populated ingredients and tags.
 */
export interface CocktailWithDetails extends CocktailBase {
  id: number;
  created_at: string;
  updated_at: string;
  average_rating: number | null; // Added for rating functionality
  ratings_count: number;         // Added for rating functionality
  
  ingredients: CocktailIngredientDetail[];
  tags: Tag[];
  owner_id: number;
}

export type CocktailUpdate = Partial<Omit<CocktailCreate, 'name' | 'description' | 'instructions'> & {
  name?: string;
  description?: string;
  instructions?: string;
}>;

export interface Rating {
  id: number;
  rating_value: number;
  cocktail_id: number;
  user_id: number;
  created_at: string;
  updated_at: string | null;
}

export interface RatingCreate {
  cocktail_id: number;
  rating_value: number;
  comment?: string;
}

export interface RatingUpdate {
  rating_value?: number; 
  comment?: string;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}