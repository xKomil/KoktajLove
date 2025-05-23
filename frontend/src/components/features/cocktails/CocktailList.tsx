// frontend/src/components/features/cocktails/CocktailList.tsx
import React from 'react';
import { CocktailWithDetails } from '@/types/cocktailTypes';
import CocktailCard from './CocktailCard';
import Spinner from '@/components/ui/Spinner/Spinner';
import Button from '@/components/ui/Button/Button';
import styles from './CocktailList.module.css';

interface CocktailListProps {
  cocktails: CocktailWithDetails[];
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
  onAddCocktail?: () => void;
}

const CocktailList: React.FC<CocktailListProps> = ({ 
  cocktails, 
  isLoading, 
  error, 
  onRetry,
  onAddCocktail 
}) => {
  // Stan ładowania
  if (isLoading) {
    return (
      <div className={styles.listContainer}>
        <div className={`${styles.statusMessageContainer} ${styles.loadingContainer}`}>
          <div className={styles.loadingSpinner}>
            <Spinner size="lg" color="var(--color-primary)" />
          </div>
          <p className={styles.loadingText}>
            Ładowanie koktajli...
          </p>
        </div>
      </div>
    );
  }

  // Stan błędu
  if (error) {
    return (
      <div className={styles.listContainer}>
        <div className={`${styles.statusMessageContainer} ${styles.errorContainer}`}>
          {/* Ikona błędu - można zastąpić rzeczywistą ikoną */}
          <div className={styles.errorIcon}>
            ⚠️
          </div>
          <h3 className={styles.errorTitle}>
            Ups! Coś poszło nie tak
          </h3>
          <p className={styles.errorMessage}>
            Nie udało się załadować listy koktajli. {error.message}
          </p>
          {onRetry && (
            <Button 
              variant="outline-primary" 
              onClick={onRetry}
              className={styles.actionButton}
            >
              Spróbuj ponownie
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Stan braku danych
  if (!cocktails || cocktails.length === 0) {
    return (
      <div className={styles.listContainer}>
        <div className={`${styles.statusMessageContainer} ${styles.emptyContainer}`}>
          {/* Ikona pustej listy - można zastąpić rzeczywistą ikoną */}
          <div className={styles.emptyIcon}>
            🍸
          </div>
          <h3 className={styles.emptyTitle}>
            Brak koktajli
          </h3>
          <p className={styles.emptyMessage}>
            Nie znaleziono żadnych koktajli. Może czas dodać pierwszy do kolekcji?
          </p>
          {onAddCocktail && (
            <Button 
              variant="primary" 
              onClick={onAddCocktail}
              className={styles.actionButton}
            >
              Dodaj koktajl
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Renderowanie listy koktajli
  return (
    <div className={styles.listContainer}>
      {cocktails.map((cocktail) => (
        <CocktailCard key={cocktail.id} cocktail={cocktail} />
      ))}
    </div>
  );
};

export default CocktailList;