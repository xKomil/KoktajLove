// frontend/src/utils/helpers.ts

/**
 * Delays execution for a specified number of milliseconds.
 * Useful for simulating network latency or debouncing.
 * @param ms - The number of milliseconds to wait.
 * @returns A promise that resolves after the specified delay.
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Capitalizes the first letter of a string.
 * @param str - The string to capitalize.
 * @returns The capitalized string, or an empty string if input is null/undefined.
 */
export const capitalizeFirstLetter = (str?: string | null): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Formats a date string or Date object into a more readable format.
 * Example: "January 1, 2023"
 * @param dateInput - The date string (ISO format) or Date object.
 * @param options - Optional Intl.DateTimeFormatOptions.
 * @returns Formatted date string, or an empty string if input is invalid.
 */
export const formatDate = (
  dateInput?: string | Date | null,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateInput) return '';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    };
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return ''; // Or return the original input, or a specific error string
  }
};

/**
 * Truncates a string to a specified length and appends an ellipsis if truncated.
 * @param text - The string to truncate.
 * @param maxLength - The maximum length of the string before truncation.
 * @param ellipsis - The string to append if truncated (default: "...").
 * @returns The truncated string or the original string if shorter than maxLength.
 */
export const truncateText = (text: string, maxLength: number, ellipsis: string = "..."): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - ellipsis.length) + ellipsis;
};

/**
 * Generates a simple unique ID.
 * NOTE: For truly unique IDs in a distributed system, use libraries like `uuid`.
 * This is for simple client-side non-critical use.
 * @returns A string representing a unique ID.
 */
export const generateSimpleId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

/**
 * Parses JWT token to get payload data.
 * Does not verify the token signature.
 * @param token The JWT string.
 * @returns The payload object or null if parsing fails.
 */
export const parseJwtPayload = (token: string): Record<string, any> | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to parse JWT payload:", e);
    return null;
  }
};

// Add more helper functions as your application grows.