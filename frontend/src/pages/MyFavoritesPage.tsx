// frontend/src/pages/MyFavoritesPage.tsx
import React, { useEffect, useState } from 'react';
import CocktailList from '@/components/features/cocktails/CocktailList';
import * as favoriteService from '@/services/favoriteService';
import { CocktailWithDetails } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/ui/Spinner/Spinner';
import styles from './PageStyles.module.css';

const MyFavoritesPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [favoriteCocktails, setFavoriteCocktails] = useState<CocktailWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to resolve

    if (!user) {
      // Should be handled by ProtectedRoute, but as a fallback:
      setError(new Error('You must be logged in to view your favorites.'));
      setIsLoading(false);
      return;
    }

    const fetchFavorites = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await favoriteService.getFavoriteCocktails();
        setFavoriteCocktails(data);
      } catch (err: any) {
        console.error('Failed to fetch favorite cocktails:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [user, authLoading]);

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>My Favorite Cocktails</h1>
      
      {isLoading || authLoading ? (
        <div className={styles.centeredMessage}><Spinner /> <p>Loading your favorites...</p></div>
      ) : error ? (
        <p className={`${styles.centeredMessage} ${styles.error}`}>
          Failed to load favorites: {error.message}
        </p>
      ) : favoriteCocktails.length === 0 ? (
        <p className={styles.centeredMessage}>You haven't added any cocktails to your favorites yet.</p>
      ) : (
        <CocktailList cocktails={favoriteCocktails} isLoading={false} error={null} />
      )}
    </div>
  );
};

export default MyFavoritesPage;