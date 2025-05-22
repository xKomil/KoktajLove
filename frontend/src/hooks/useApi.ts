// frontend/src/hooks/useApi.ts
import { useState, useCallback } from 'react';
// import apiClient from '../services/apiClient'; // Not strictly needed if apiFunc uses apiClient internally

interface UseApiState<T> {
  data: T | null;
  error: Error | any | null; // Can be more specific if error structure is known
  isLoading: boolean;
}

// P extends any[] allows for any number of arguments of any type for the apiFunc
type ApiFunction<T, P extends any[]> = (...args: P) => Promise<T>;

// The hook returns a tuple:
// 1. The memoized function to execute the API call.
// 2. The current state (data, error, isLoading).
export function useApi<T, P extends any[]>(
  apiFunc: ApiFunction<T, P>
): [ (...args: P) => Promise<T>, UseApiState<T> ] {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(async (...args: P): Promise<T> => {
    setState(prevState => ({ ...prevState, isLoading: true, error: null }));
    try {
      const result = await apiFunc(...args);
      setState({ data: result, error: null, isLoading: false });
      return result;
    } catch (err: any) {
      // Log the error for debugging purposes
      console.error('API call failed:', err.response?.data || err.message || err);
      // Store the error object. You might want to transform it or extract a message.
      // For now, storing the whole error object or response data if available.
      const errorToStore = err.response?.data || err;
      setState({ data: null, error: errorToStore, isLoading: false });
      throw errorToStore; // Re-throw the error so the caller can also handle it if needed
    }
  }, [apiFunc]);

  return [execute, state];
}