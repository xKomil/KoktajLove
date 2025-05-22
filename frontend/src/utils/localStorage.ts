// frontend/src/utils/localStorage.ts

/**
 * Safely retrieves an item from localStorage and parses it as JSON.
 * @param key - The key of the item to retrieve.
 * @returns The parsed item, or null if the item doesn't exist or parsing fails.
 *          Type T is the expected type of the stored item.
 */
export const getItem = <T>(key: string): T | null => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  } catch (error) {
    console.error(`Error getting item "${key}" from localStorage:`, error);
    return null;
  }
};

/**
 * Safely stores an item in localStorage after serializing it to JSON.
 * @param key - The key under which to store the item.
 * @param value - The value to store. It will be JSON.stringified.
 *                Type T is the type of the value being stored.
 */
export const setItem = <T>(key: string, value: T): void => {
  try {
    const serializedValue = JSON.stringify(value);
    window.localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error(`Error setting item "${key}" in localStorage:`, error);
  }
};

/**
 * Safely removes an item from localStorage.
 * @param key - The key of the item to remove.
 */
export const removeItem = (key: string): void => {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing item "${key}" from localStorage:`, error);
  }
};

/**
 * Clears all items from localStorage.
 * Use with caution, as this will remove all data stored by your application.
 */
export const clearAll = (): void => {
  try {
    window.localStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

// Example of a more specific localStorage utility for a common item:
// const AUTH_TOKEN_KEY = 'authToken';

// export const getAuthToken = (): string | null => {
//   return getItem<string>(AUTH_TOKEN_KEY);
// };

// export const setAuthToken = (token: string): void => {
//   setItem<string>(AUTH_TOKEN_KEY, token);
// };

// export const removeAuthToken = (): void => {
//   removeItem(AUTH_TOKEN_KEY);
// };