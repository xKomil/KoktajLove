// frontend/src/pages/HomePage.tsx
import React, { useEffect, useState } from 'react';
import CocktailList from '@/components/features/cocktails/CocktailList';
import * as cocktailService from '@/services/cocktailService';
// Usuń import PaginatedResponse, jeśli nie jest używany explicite jako typ
// import { CocktailWithDetails, PaginatedResponse } from '@/types';
import { CocktailWithDetails } from '@/types'; // PaginatedResponse będzie znany przez TypeScript z serwisu
import styles from './PageStyles.module.css';
import Spinner from '@/components/ui/Spinner/Spinner';

const HomePage: React.FC = () => {
  const [cocktails, setCocktails] = useState<CocktailWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCocktails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params: cocktailService.CocktailFilters = { is_public: true };
        // Typ `responseData` zostanie wywnioskowany przez TS jako
        // CocktailWithDetails[] | PaginatedResponse<CocktailWithDetails>
        // na podstawie tego, co zwraca cocktailService.getCocktails
        const responseData = await cocktailService.getCocktails(params);
        
        if (responseData && typeof responseData === 'object' && 'items' in responseData && 'total' in responseData) {
          setCocktails(responseData.items);
        } else if (Array.isArray(responseData)) {
          setCocktails(responseData);
        } else {
          console.warn("Otrzymano nieoczekiwany format danych dla koktajli:", responseData);
          setCocktails([]);
        }

      } catch (err: any) {
        console.error('Failed to fetch cocktails:', err);
        setError(err);
        setCocktails([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCocktails();
  }, []);

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Welcome to KoktajLOVE!</h1>
      <p className={styles.pageSubtitle}>Discover and share amazing cocktail recipes.</p>
      
      {isLoading && <div className={styles.centeredMessage}><Spinner /> <p>Loading cocktails...</p></div>}
      {error && <p className={`${styles.centeredMessage} ${styles.error}`}>Failed to load cocktails: {error.message}</p>}
      
      {!isLoading && !error && cocktails.length === 0 && (
        <p className={styles.centeredMessage}>No cocktails found. Why not add one?</p>
      )}

      {!isLoading && !error && cocktails.length > 0 && (
        <CocktailList cocktails={cocktails} isLoading={false} error={null} />
      )}
    </div>
  );
};

export default HomePage;