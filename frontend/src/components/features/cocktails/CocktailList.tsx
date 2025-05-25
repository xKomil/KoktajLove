// frontend/src/components/features/cocktails/CocktailList.tsx
import React from 'react';
import { CocktailWithDetails } from '@/types/cocktailTypes'; // Type definition for cocktail data
import CocktailCard from './CocktailCard'; // Component to display individual cocktail cards
import Spinner from '@/components/ui/Spinner/Spinner'; // UI component for loading indication
import Button from '@/components/ui/Button/Button'; // UI component for buttons
import styles from './CocktailList.module.css'; // CSS module for styling

/**
 * Interface for the CocktailList component's props.
 */
interface CocktailListProps {
  cocktails: CocktailWithDetails[]; // Array of cocktail data to display
  isLoading: boolean; // Flag indicating if the list is currently loading
  error: Error | null; // Error object if fetching data failed, null otherwise
  onRetry?: () => void; // Optional callback function to retry fetching data
  onAddCocktail?: () => void; // Optional callback function to navigate to add cocktail page or open a modal
}

/**
 * CocktailList component.
 * Displays a list of cocktails, or loading/error/empty states.
 */
const CocktailList: React.FC<CocktailListProps> = ({
  cocktails,
  isLoading,
  error,
  onRetry,
  onAddCocktail
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className={styles.listContainer}>
        <div className={`${styles.statusMessageContainer} ${styles.loadingContainer}`}>
          <div className={styles.loadingSpinner}>
            <Spinner size="lg" color="var(--color-primary)" />
          </div>
          <p className={styles.loadingText}>
            Loading cocktails...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.listContainer}>
        <div className={`${styles.statusMessageContainer} ${styles.errorContainer}`}>
          {/* Error Icon - can be replaced with an actual icon component */}
          <div className={styles.errorIcon}>
            ⚠️
          </div>
          <h3 className={styles.errorTitle}>
            Oops! Something went wrong
          </h3>
          <p className={styles.errorMessage}>
            Failed to load the cocktail list. {error.message}
          </p>
          {/* Display retry button if onRetry callback is provided */}
          {onRetry && (
            <Button
              variant="outline-primary"
              onClick={onRetry}
              className={styles.actionButton}
            >
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Empty state (no cocktails found)
  if (!cocktails || cocktails.length === 0) {
    return (
      <div className={styles.listContainer}>
        <div className={`${styles.statusMessageContainer} ${styles.emptyContainer}`}>
          {/* Empty List Icon - can be replaced with an actual icon component */}
          <div className={styles.emptyIcon}>
            🍸
          </div>
          <h3 className={styles.emptyTitle}>
            No Cocktails Found
          </h3>
          <p className={styles.emptyMessage}>
            No cocktails were found. Maybe it's time to add the first one to your collection?
          </p>
          {/* Display "Add Cocktail" button if onAddCocktail callback is provided */}
          {onAddCocktail && (
            <Button
              variant="primary"
              onClick={onAddCocktail}
              className={styles.actionButton}
            >
              Add Cocktail
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Render the list of cocktails
  return (
    <div className={styles.listContainer}>
      {cocktails.map((cocktail) => (
        <CocktailCard key={cocktail.id} cocktail={cocktail} />
      ))}
    </div>
  );
};

export default CocktailList;