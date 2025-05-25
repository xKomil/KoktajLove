// MyFavoritesPage.tsx - Poprawiona wersja z lepszą obsługą błędów i UX
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CocktailList from '@/components/features/cocktails/CocktailList';
import * as favoriteService from '@/services/favoriteService';
import { CocktailWithDetails } from '@/types/cocktailTypes';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button/Button';
import styles from './MyFavoritesPage.module.css';

const MyFavoritesPage: React.FC = () => {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [favoriteCocktails, setFavoriteCocktails] = useState<CocktailWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await favoriteService.getFavoriteCocktails();
      setFavoriteCocktails(data);
    } catch (err: any) {
      console.error('Failed to fetch favorite cocktails:', err);
      let errorMessage = 'Nie udało się załadować ulubionych koktajli.';
      
      if (err.response?.status === 401) {
        errorMessage = 'Sesja wygasła. Zaloguj się ponownie.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Błąd serwera. Spróbuj ponownie później.';
      } else if (!err.response) {
        errorMessage = 'Brak połączenia z serwerem.';
      }
      
      setError(new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Initial data fetch
  useEffect(() => {
    if (authLoading) return; // Wait for auth to resolve
    
    if (!isAuthenticated) {
      // This should be handled by ProtectedRoute, but as fallback
      setError(new Error('Musisz być zalogowany, aby zobaczyć ulubione koktajle.'));
      setIsLoading(false);
      return;
    }

    fetchFavorites();
  }, [authLoading, isAuthenticated, fetchFavorites]);

  // Handle retry
  const handleRetry = useCallback(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Handle navigation to discover cocktails
  const handleDiscoverCocktails = useCallback(() => {
    navigate('/cocktails');
  }, [navigate]);

  // Handle navigation to add cocktail
  const handleAddCocktail = useCallback(() => {
    navigate('/add-cocktail');
  }, [navigate]);

  // Loading state while auth is resolving
  if (authLoading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.centeredMessage}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Sprawdzanie autoryzacji...</p>
          </div>
        </div>
      </div>
    );
  }

  // Auth error state
  if (!isAuthenticated) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.centeredMessage}>
          <h2>Dostęp zabroniony</h2>
          <p>Musisz być zalogowany, aby zobaczyć swoje ulubione koktajle.</p>
          <Button variant="primary" onClick={() => navigate('/login')}>
            Zaloguj się
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Moje Ulubione Koktajle</h1>
        <p className={styles.pageSubtitle}>
          {user?.username ? `Witaj ${user.username}!` : 'Witaj!'} 
          {' '}Tutaj znajdziesz wszystkie koktajle, które oznaczyłeś jako ulubione.
        </p>
      </div>
      
      {isLoading ? (
        <div className={styles.centeredMessage}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Ładowanie ulubionych koktajli...</p>
          </div>
        </div>
      ) : error ? (
        <div className={styles.centeredMessage}>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <h3>Ups! Coś poszło nie tak</h3>
            <p className={styles.errorMessage}>{error.message}</p>
            <div className={styles.actionButtons}>
              <Button variant="primary" onClick={handleRetry}>
                Spróbuj ponownie
              </Button>
              <Button variant="outline" onClick={handleDiscoverCocktails}>
                Przeglądaj koktajle
              </Button>
            </div>
          </div>
        </div>
      ) : favoriteCocktails.length === 0 ? (
        <div className={styles.centeredMessage}>
          <div className={styles.emptyContainer}>
            <h3>Brak ulubionych koktajli</h3>
            <p className={styles.emptyMessage}>
              Nie masz jeszcze żadnych ulubionych koktajli. 
              Czas odkryć swoje nowe ulubione drinki!
            </p>
            <div className={styles.actionButtons}>
              <Button variant="primary" onClick={handleDiscoverCocktails}>
                Odkryj koktajle
              </Button>
              <Button variant="outline" onClick={handleAddCocktail}>
                Dodaj własny koktajl
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.resultsHeader}>
            <p className={styles.resultsCount}>
              Znaleziono {favoriteCocktails.length} {
                favoriteCocktails.length === 1
                  ? 'ulubiony koktajl'
                  : favoriteCocktails.length <= 4
                  ? 'ulubione koktajle'
                  : 'ulubionych koktajli'
              }
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchFavorites}
              disabled={isLoading}
            >
              Odśwież listę
            </Button>
          </div>
          
          <CocktailList 
            cocktails={favoriteCocktails} 
            isLoading={false} 
            error={null}
            // Przekazujemy callback do ponownego ładowania po zmianach
            onRetry={handleRetry}
            onAddCocktail={handleAddCocktail}
          />
        </>
      )}
    </div>
  );
};

export default MyFavoritesPage;