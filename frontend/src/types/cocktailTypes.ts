// frontend/src/types/cocktailTypes.ts

/**
 * Represents an ingredient.
 */
export interface Ingredient {
  id: number;
  name: string;
  description?: string | null;
  // created_at?: string; // If you track creation/update times
  // updated_at?: string;
}

/**
 * Data for creating a new ingredient.
 */
export type IngredientCreate = Omit<Ingredient, 'id'>;

/**
 * Data for updating an existing ingredient (all fields optional).
 */
export type IngredientUpdate = Partial<IngredientCreate>;


/**
 * Represents a tag.
 */
export interface Tag {
  id: number;
  name: string;
  // created_at?: string;
  // updated_at?: string;
}

/**
 * Data for creating a new tag.
 */
export type TagCreate = Omit<Tag, 'id'>;

/**
 * Data for updating an existing tag.
 */
export type TagUpdate = Partial<TagCreate>;


/**
 * Enum for units of measurement for ingredients.
 * Should match the enum defined in your FastAPI backend.
 */
export enum UnitEnum {
  ml = "ml",
  l = "l", // Liter
  oz = "oz", // Ounce
  cl = "cl", // Centiliter
  piece = "piece",
  g = "g",   // Gram
  kg = "kg", // Kilogram
  dash = "dash",
  pinch = "pinch",
  splash = "splash", // Splash
  tsp = "tsp", // Teaspoon
  tbsp = "tbsp", // Tablespoon
  cup = "cup", // Cup
  slice = "slice",
  sprig = "sprig", // e.g. for mint
  leaf = "leaf", // e.g. for basil
  // Add other units as necessary
}

/**
 * Represents an ingredient used in a cocktail, including its quantity and unit.
 * This is for displaying cocktail details where ingredient info is populated.
 */
export interface CocktailIngredient {
  ingredient: Ingredient; // The full ingredient object
  quantity: number;
  unit: UnitEnum;
  // id?: number; // If this link has its own ID in a join table
}

/**
 * Base properties for a cocktail.
 */
export interface CocktailBase {
  name: string;
  description: string;
  instructions: string;
  image_url?: string | null;
  is_public: boolean; // Default to true or false based on your app logic
}

/**
 * Represents a cocktail with all its details, including populated ingredients and tags.
 * This is typically what you get when fetching a single cocktail or a list.
 */
export interface CocktailWithDetails extends CocktailBase {
  id: number;
  created_at: string;
  updated_at: string;
  average_rating: number | null; // Can be null if not rated
  total_ratings?: number; // Optional: number of ratings received
  ingredients: CocktailIngredient[];
  tags: Tag[];
  owner_id: number; // ID of the user who created the cocktail
  // owner?: User; // Optional: if you want to embed owner details
}

/**
 * Data structure for creating a new cocktail.
 * Ingredients and tags are referenced by their IDs.
 */
export interface CocktailCreate extends CocktailBase {
  ingredients: {
    ingredient_id: number;
    quantity: number;
    unit: UnitEnum;
  }[];
  tag_ids: number[]; // Array of tag IDs
}

/**
 * Data structure for updating an existing cocktail.
 * All fields are optional (Partial), and you might send only the changes.
 */
export type CocktailUpdate = Partial<CocktailCreate>;


/**
 * Represents a rating given to a cocktail.
 */
export interface Rating {
  id: number;
  score: number; // e.g., 1-5
  cocktail_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  // comment?: string | null; // Optional: if ratings can have comments
}

/**
 * Data for creating a new rating.
 */
export type RatingCreate = Pick<Rating, 'score' | 'cocktail_id'>; // user_id usually from auth token

/**
 * Data for updating an existing rating (e.g., changing the score).
 */
export type RatingUpdate = Partial<Pick<Rating, 'score'>>;


/**
 * Generic paginated response structure from the API.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;    // Total number of items available
  page: number;     // Current page number
  size: number;     // Number of items per page
  pages?: number;   // Total number of pages (optional, can be calculated)
  next?: string | null; // URL for the next page
  previous?: string | null; // URL for the previous page
}