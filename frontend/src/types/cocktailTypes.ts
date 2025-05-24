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
  TSP = "łyżeczka",
  TBSP = "łyżka",
  OZ = "oz",
  SHOT = "shot",
  DASH = "kropla",
  PIECE = "sztuka",
  SLICE = "plasterek",
  OTHER = "inna",
}

// --- ZMIANY ZACZYNAJĄ SIĘ TUTAJ ---

/**
 * Data for an ingredient when creating/updating a cocktail (to match backend's CocktailIngredientData).
 */
export interface CocktailIngredientCreateData {
  ingredient_id: number;
  amount: number; // ZMIANA: z quantity na amount (i typ na number, zakładając, że backend oczekuje int)
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
  image_url?: string | null; // Pozwalamy na null
  is_public: boolean;
}

/**
 * Data structure for creating a new cocktail.
 * This now matches the backend's CocktailCreate schema.
 */
export interface CocktailCreate extends CocktailBase {
  ingredients: CocktailIngredientCreateData[]; // Używa nowego typu
  tags: CocktailTagCreateData[];             // Używa nowego typu
}

/**
 * Represents an ingredient as part of detailed cocktail information (matches backend's IngredientInCocktailDetail).
 */
export interface CocktailIngredientDetail { // Zmieniona nazwa z CocktailIngredient dla jasności
  ingredient: Ingredient; // Pełny obiekt składnika (lub tylko ID i name, jeśli tak zwraca backend)
                          // Twój backendowy IngredientInCocktailDetail dziedziczy z IngredientSchema,
                          // więc powinien mieć wszystkie pola IngredientSchema.
  amount: number;         // ZMIANA: z quantity na amount
  unit: UnitEnum;
}


/**
 * Represents a cocktail with all its details, including populated ingredients and tags.
 */
export interface CocktailWithDetails extends CocktailBase {
  id: number;
  created_at: string;
  updated_at: string;
  average_rating: number | null;
  total_ratings?: number;
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
  score: number;
  cocktail_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export type RatingCreate = Pick<Rating, 'score' | 'cocktail_id'>;
export type RatingUpdate = Partial<Pick<Rating, 'score'>>;