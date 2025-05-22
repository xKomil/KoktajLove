// frontend/src/components/features/cocktails/CocktailList.tsx
import React from 'react';
import { CocktailWithDetails } from '@/types/cocktailTypes';
import CocktailCard from './CocktailCard';
import Spinner from '@/components/ui/Spinner/Spinner';
import styles from './CocktailList.module.css';

interface CocktailListProps {
  cocktails: CocktailWithDetails[];
  isLoading: boolean;
  error: Error | null;
}

const CocktailList: React.FC<CocktailListProps> = ({ cocktails, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner />
        <p>Loading cocktails...</p>
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Error loading cocktails: {error.message}</div>;
  }

  if (!cocktails || cocktails.length === 0) {
    return <div className={styles.noCocktails}>No cocktails found.</div>;
  }

  return (
    <div className={styles.listContainer}>
      {cocktails.map((cocktail) => (
        <CocktailCard key={cocktail.id} cocktail={cocktail} />
      ))}
    </div>
  );
};

export default CocktailList;