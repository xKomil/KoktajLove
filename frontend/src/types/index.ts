// frontend/src/types/index.ts
// This file re-exports types from other files in the types/ directory
// for easier importing into components and services.

export * from './authTypes';
export * from './cocktailTypes';
export * from './commonTypes';

// Example of a specific type that might combine others or be unique:
export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number; // Optional: how long to display, in ms
}