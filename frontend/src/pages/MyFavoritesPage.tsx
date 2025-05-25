// MyFavoritesPage.tsx - Improved version with better error handling and UX
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CocktailList from '@/components/features/cocktails/CocktailList'; // Component to display a list of cocktails
import * as favoriteService from '@/services/favoriteService'; // Service for favorite-related API calls
import { CocktailWithDetails } from '@/types/cocktailTypes'; // TypeScript type for cocktail data
import { useAuth } from '@/hooks/useAuth'; // Custom hook for authentication context
import Button from '@/components/ui/Button/Button'; // UI Button component
import styles from './MyFavoritesPage.module.css'; // CSS module for styling

/**
 * MyFavoritesPage component.
 * Displays a list of the authenticated user's favorite cocktails.
 * Handles loading, error, and empty states.
 */
const MyFavoritesPage: React.FC = () => {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth(); // Auth context data
  const navigate = useNavigate(); // Hook for programmatic navigation
  const [favoriteCocktails, setFavoriteCocktails] = useState<CocktailWithDetails[]>([]); // State for favorite cocktails
  const [isLoading, setIsLoading] = useState(true); // State for loading favorite cocktails
  const [error, setError] = useState<Error | null>(null); // State for any errors during data fetching

  /**
   * Fetches the list of favorite cocktails for the authenticated user.
   * Memoized with useCallback.
   */
  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) return; // Guard clause: user must be authenticated

    setIsLoading(true);
    setError(null); // Clear previous errors

    try {
      const data = await favoriteService.getFavoriteCocktails();
      setFavoriteCocktails(data);
    } catch (err: any) {
      console.error('Failed to fetch favorite cocktails:', err);
      let errorMessage = 'Failed to load favorite cocktails.'; // Default error message

      // Provide more specific error messages based on HTTP status code
      if (err.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (!err.response) {
        errorMessage = 'No connection to the server.';
      }
      // Could also add more specific messages for other statuses like 404 if applicable

      setError(new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]); // Dependency: re-fetch if authentication status changes (though ProtectedRoute should handle this)

  // Effect for initial data fetch when component mounts or auth status changes
  useEffect(() => {
    if (authLoading) return; // Wait for authentication status to be resolved

    if (!isAuthenticated) {
      // This scenario should ideally be handled by a ProtectedRoute component,
      // but this serves as a fallback.
      setError(new Error('You must be logged in to view your favorite cocktails.'));
      setIsLoading(false); // Stop page-specific loading
      return;
    }

    fetchFavorites();
  }, [authLoading, isAuthenticated, fetchFavorites]); // Dependencies for the effect

  /**
   * Handles the retry action when fetching favorites fails.
   */
  const handleRetry = useCallback(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  /**
   * Navigates to the main cocktails discovery page.
   */
  const handleDiscoverCocktails = useCallback(() => {
    navigate('/cocktails');
  }, [navigate]);

  /**
   * Navigates to the page for adding a new cocktail.
   */
  const handleAddCocktail = useCallback(() => {
    navigate('/add-cocktail');
  }, [navigate]);

  // Loading state while authentication status is being checked
  if (authLoading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.centeredMessage}>
          <div className={styles.loadingContainer}>
            {/* Assuming styles.spinner provides a CSS spinner */}
            <div className={styles.spinner} />
            <p>Checking authorization...</p>
          </div>
        </div>
      </div>
    );
  }

  // State when user is not authenticated (should be rare if ProtectedRoute is used)
  if (!isAuthenticated) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.centeredMessage}>
          <h2>Access Denied</h2>
          <p>You must be logged in to view your favorite cocktails.</p>
          <Button variant="primary" onClick={() => navigate('/login')}>
            Log In
          </Button>
        </div>
      </div>
    );
  }

  // Main content rendering
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>My Favorite Cocktails</h1>
        <p className={styles.pageSubtitle}>
          {user?.username ? `Welcome ${user.username}!` : 'Welcome!'}
          {' '}Here you'll find all the cocktails you've marked as favorites.
        </p>
      </div>

      {/* Conditional rendering based on loading, error, or data availability */}
      {isLoading ? (
        // Loading state for favorite cocktails
        <div className={styles.centeredMessage}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Loading favorite cocktails...</p>
          </div>
        </div>
      ) : error ? (
        // Error state
        <div className={styles.centeredMessage}>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div> {/* Error icon */}
            <h3>Oops! Something went wrong</h3>
            <p className={styles.errorMessage}>{error.message}</p>
            <div className={styles.actionButtons}>
              <Button variant="primary" onClick={handleRetry}>
                Try Again
              </Button>
              <Button variant="outline" onClick={handleDiscoverCocktails}>
                Browse Cocktails
              </Button>
            </div>
          </div>
        </div>
      ) : favoriteCocktails.length === 0 ? (
        // Empty state (no favorites found)
        <div className={styles.centeredMessage}>
          <div className={styles.emptyContainer}>
            <h3>No Favorite Cocktails</h3>
            <p className={styles.emptyMessage}>
              You don't have any favorite cocktails yet.
              Time to discover your new favorite drinks!
            </p>
            <div className={styles.actionButtons}>
              <Button variant="primary" onClick={handleDiscoverCocktails}>
                Discover Cocktails
              </Button>
              <Button variant="outline" onClick={handleAddCocktail}>
                Add Your Own Cocktail
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Display list of favorite cocktails
        <>
          <div className={styles.resultsHeader}>
            <p className={styles.resultsCount}>
              Found {favoriteCocktails.length} {
                favoriteCocktails.length === 1
                  ? 'favorite cocktail'
                  : 'favorite cocktails'
              }
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFavorites} // Allows manual refresh
              disabled={isLoading} // Disable while loading
            >
              Refresh List
            </Button>
          </div>

          <CocktailList
            cocktails={favoriteCocktails}
            isLoading={false} // isLoading is handled by this page component
            error={null} // error is handled by this page component
            // Pass callbacks for actions that might be relevant to a list context
            onRetry={handleRetry} // Could be used by CocktailList if it had its own retry logic
            onAddCocktail={handleAddCocktail} // Potentially for an "Add" button within the list
          />
        </>
      )}
    </div>
  );
};

export default MyFavoritesPage;