// frontend/src/pages/HomePage.tsx
import React, { useEffect, useState } from 'react';
import CocktailList from '@/components/features/cocktails/CocktailList';
import * as cocktailService from '@/services/cocktailService';
import { CocktailWithDetails } from '@/types';
// import { useApi } from '@/hooks/useApi'; // Alternative using useApi
import styles from './PageStyles.module.css'; // Optional: create a shared page style for consistency
import Spinner from '@/components/ui/Spinner/Spinner';

const HomePage: React.FC = () => {
  const [cocktails, setCocktails] = useState<CocktailWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Example using useState for loading/error
  useEffect(() => {
    const fetchCocktails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch only public cocktails, or all if no filter applied by default on backend
        const data = await cocktailService.getCocktails({ is_public: true }); 
        setCocktails(data);
      } catch (err: any) {
        console.error('Failed to fetch cocktails:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCocktails();
  }, []);

  // // Example using useApi custom hook
  // const [fetchCocktails, { data: cocktailsData, isLoading, error }] = useApi(
  //   () => cocktailService.getCocktails({ is_public: true })
  // );
  // useEffect(() => {
  //   fetchCocktails();
  // }, [fetchCocktails]);
  // const cocktails = cocktailsData || [];


  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Welcome to KoktajLOVE!</h1>
      <p className={styles.pageSubtitle}>Discover and share amazing cocktail recipes.</p>
      
      {/* TODO: Add search/filter bar component here */}
      {/* <CocktailFilters onFilterChange={handleFilterChange} /> */}

      {isLoading && <div className={styles.centeredMessage}><Spinner /> <p>Loading cocktails...</p></div>}
      {error && <p className={`${styles.centeredMessage} ${styles.error}`}>Failed to load cocktails: {error.message}</p>}
      {!isLoading && !error && (
        <CocktailList cocktails={cocktails} isLoading={false} error={null} />
      )}
    </div>
  );
};

export default HomePage;