// frontend/src/types/commonTypes.ts

/**
 * Generic paginated response structure if not already defined in specific type files.
 * It's good practice to have a common one.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages?: number;
  next?: string | null;
  previous?: string | null;
}

/**
 * Common query parameters for pagination.
 */
export interface CommonQueryPaginationParams {
  page?: number;  // Current page number (usually 1-indexed)
  size?: number; // Number of items per page
}

/**
 * Represents a generic error structure from the API, if consistent.
 * Often, FastAPI validation errors have a specific structure.
 */
export interface ApiErrorDetail {
  loc: (string | number)[]; // Location of the error (e.g., ["body", "field_name"])
  msg: string;             // Error message
  type: string;            // Error type (e.g., "value_error.missing")
}

export interface ApiErrorResponse {
  detail: string | ApiErrorDetail[]; // Can be a single message or an array of validation errors
}

/**
 * A simple key-value pair type for generic objects or dictionaries.
 */
export interface KeyValuePair<T = any> {
  [key: string]: T;
}