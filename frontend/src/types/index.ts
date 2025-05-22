// frontend/src/types/index.ts

export * from './authTypes';
export * from './cocktailTypes';
export * from './commonTypes'; // To wyeksportuje PaginatedResponse z commonTypes.ts

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}