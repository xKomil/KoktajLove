// frontend/src/pages/CocktailDetailPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // React Router hooks for navigation and URL parameters
import * as cocktailService from '@/services/cocktailService'; // Service for cocktail-related API calls
import { CocktailWithDetails, Rating } from '@/types'; // TypeScript types for cocktail and rating data
import Spinner from '@/components/ui/Spinner/Spinner'; // UI component for loading indication
import Button from '@/components/ui/Button/Button'; // UI component for buttons
import RatingStars from '@/components/features/cocktails/RatingStars'; // Component for displaying and interacting with star ratings
import { useAuth } from '@/hooks/useAuth'; // Custom hook for authentication context
import * as ratingService from '@/services/ratingService'; // Service for rating-related API calls
import * as favoriteService from '@/services/favoriteService'; // Service for favorite-related API calls
import styles from './PageStyles.module.css'; // General page styles, shared across different page components
import detailStyles from './CocktailDetailPage.module.css'; // Specific styles for the CocktailDetailPage

/**
 * CocktailDetailPage component.
 * Displays detailed information about a specific cocktail, allows users to rate it,
 * add/remove it from favorites, and edit/delete it if they are the owner.
 */
const CocktailDetailPage: React.FC = () => {
  // Get cocktailId from URL parameters
  const { cocktailId } = useParams<{ cocktailId: string }>();
  // Get authentication status and user data from useAuth hook
  const { user, isAuthenticated } = useAuth();
  // Hook for programmatic navigation
  const navigate = useNavigate();

  // State for storing the fetched cocktail details
  const [cocktail, setCocktail] = useState<CocktailWithDetails | null>(null);
  // State for managing the loading status of the page
  const [isLoading, setIsLoading] = useState(true);
  // State for storing any error message during data fetching
  const [error, setError] = useState<string | null>(null);
  // State for storing the current authenticated user's rating for this cocktail
  const [userRating, setUserRating] = useState<number | null>(null);
  // State for tracking if the cocktail is marked as a favorite by the current user
  const [isFavorite, setIsFavorite] = useState(false);
  // State for managing the loading status of rating submission
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  // State for managing the loading status of favorite toggling
  const [isFavoriteSubmitting, setIsFavoriteSubmitting] = useState(false);

  /**
   * Fetches cocktail details, user's rating, and favorite status.
   * Memoized with useCallback to prevent unnecessary re-renders.
   */
  const fetchCocktailDetails = useCallback(async () => {
    if (!cocktailId) {
      setError('Cocktail ID is missing.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Fetch the main cocktail data
      const data = await cocktailService.getCocktailById(cocktailId);
      setCocktail(data);

      // If user is authenticated, fetch their specific data for this cocktail
      if (isAuthenticated && user) {
        // Fetch user's rating for this cocktail
        try {
          const ratingData = await ratingService.getUserRatingForCocktail(user.id, data.id);
          setUserRating(ratingData ? ratingData.score : null);
        } catch (ratingError: any) {
          // A 404 error means the user hasn't rated this cocktail yet, which is normal.
          // Other errors might indicate a problem with the rating service.
          if (ratingError.response?.status !== 404) {
            console.warn('Could not fetch user rating:', ratingError);
            // Optionally, you could set a specific error message for rating fetch failure
          }
        }
        // Fetch favorite status for this cocktail
        try {
            const favStatus = await favoriteService.isCocktailFavorite(data.id);
            setIsFavorite(favStatus.is_favorite);
        } catch (favError) {
            console.warn('Could not fetch favorite status:', favError);
            // Optionally, set an error message for favorite status fetch failure
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch cocktail details:', err);
      // Set a user-friendly error message, trying to get details from the API response
      setError(err.response?.data?.detail || 'Failed to load cocktail details.');
    } finally {
      setIsLoading(false);
    }
  }, [cocktailId, isAuthenticated, user]); // Dependencies for useCallback

  // useEffect hook to call fetchCocktailDetails when the component mounts or dependencies change
  useEffect(() => {
    fetchCocktailDetails();
  }, [fetchCocktailDetails]);

  /**
   * Handles the submission of a new rating by the user.
   * @param newRating - The new rating value (1-5).
   */
  const handleRatingSubmit = async (newRating: number) => {
    if (!cocktail || !isAuthenticated || !user) return; // Guard clause: ensure cocktail and user data are available
    setIsRatingSubmitting(true);
    try {
      await ratingService.rateCocktail(cocktail.id, newRating);
      setUserRating(newRating); // Update local state immediately for responsiveness
      // Optionally, re-fetch cocktail details to update the average_rating displayed.
      // This ensures the average rating reflects the new user rating.
      fetchCocktailDetails();
    } catch (err) {
      console.error('Failed to submit rating:', err);
      // TODO: Implement user-facing error display for rating submission failure
      // e.g., setError('Could not submit your rating. Please try again.');
    } finally {
      setIsRatingSubmitting(false);
    }
  };

  /**
   * Toggles the favorite status of the cocktail for the authenticated user.
   */
  const handleToggleFavorite = async () => {
    if (!cocktail || !isAuthenticated) return; // Guard clause: ensure cocktail data is available and user is authenticated
    setIsFavoriteSubmitting(true);
    try {
      if (isFavorite) {
        // If currently a favorite, remove it
        await favoriteService.removeCocktailFromFavorites(cocktail.id);
        setIsFavorite(false);
      } else {
        // If not a favorite, add it
        await favoriteService.addCocktailToFavorites(cocktail.id);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Failed to update favorite status:', err);
      // TODO: Implement user-facing error display for favorite toggle failure
      // e.g., setError('Could not update favorite status. Please try again.');
    } finally {
      setIsFavoriteSubmitting(false);
    }
  };

  /**
   * Handles the deletion of the cocktail.
   * Only available to the owner of the cocktail.
   */
  const handleDeleteCocktail = async () => {
    if (!cocktail) return; // Guard clause: ensure cocktail data is available

    // Confirm deletion with the user
    if (!window.confirm(`Are you sure you want to delete "${cocktail.name}"?`)) {
      return;
    }
    try {
      await cocktailService.deleteCocktail(cocktail.id);
      navigate('/'); // Navigate to the home page or cocktail list page after successful deletion
    } catch (err) {
      console.error('Failed to delete cocktail:', err);
      setError('Could not delete cocktail. Please try again.');
    }
  };

  // Display loading spinner while data is being fetched
  if (isLoading) {
    return (
      <div className={styles.pageContainer}>
        <Spinner />
        <p>Loading cocktail...</p>
      </div>
    );
  }

  // Display error message if fetching failed
  if (error) {
    return <div className={`${styles.pageContainer} ${styles.error}`}>{error}</div>;
  }

  // Display message if cocktail data is not found (e.g., invalid ID)
  if (!cocktail) {
    return <div className={styles.pageContainer}>Cocktail not found.</div>;
  }

  // Determine if the current authenticated user is the owner of the cocktail
  const isOwner = isAuthenticated && user && user.id === cocktail.owner_id;
  // Placeholder image URL to use if cocktail.image_url is missing or fails to load
  const placeholderImage = 'https://via.placeholder.com/400x300.png?text=No+Image'; // Changed placeholder

  return (
    <div className={`${styles.pageContainer} ${detailStyles.cocktailDetailContainer}`}>
      {/* Header section: Cocktail name and owner actions (Edit/Delete) */}
      <div className={detailStyles.header}>
        <h1 className={detailStyles.name}>{cocktail.name}</h1>
        {/* Display Edit and Delete buttons if the user is the owner */}
        {isOwner && (
            <div className={detailStyles.ownerActions}>
                <Button
                    as="link" // Renders the button as a Link component
                    to={`/edit-cocktail/${cocktail.id}`}
                    variant="secondary"
                    size="sm"
                >
                    Edit
                </Button>
                <Button
                    onClick={handleDeleteCocktail}
                    variant="danger"
                    size="sm"
                    disabled={isLoading} // Disable while any main page loading is in progress (though unlikely here)
                >
                    Delete
                </Button>
            </div>
        )}
      </div>

      {/* Main content area: Image and detailed information */}
      <div className={detailStyles.mainContent}>
        <div className={detailStyles.imageContainer}>
            <img
                src={cocktail.image_url || placeholderImage}
                alt={cocktail.name}
                className={detailStyles.image}
                // Fallback to placeholder image if the primary image fails to load
                onError={(e) => {
                    const target = e.target as HTMLImageElement; // Type assertion
                    target.src = placeholderImage;
                  }}
            />
        </div>
        <div className={detailStyles.info}>
            <p className={detailStyles.description}>{cocktail.description}</p>

            {/* Average Rating Section */}
            <div className={detailStyles.ratingSection}>
                <h4>Average Rating:</h4>
                {/* Display average rating if available */}
                {cocktail.average_rating !== null && cocktail.average_rating !== undefined ? (
                    <>
                        <RatingStars rating={cocktail.average_rating} readOnly />
                        <span> ({cocktail.average_rating.toFixed(1)} / 5)</span>
                    </>
                ) : (
                    // Message if the cocktail has not been rated yet
                    <p>Not rated yet.</p>
                )}
            </div>

            {/* User Interaction Section (Your Rating, Favorite Button) - only for authenticated users */}
            {isAuthenticated && (
            <div className={detailStyles.userInteractionSection}>
                {/* User's Own Rating Section */}
                <div className={detailStyles.userRatingSection}>
                    <h4>Your Rating:</h4>
                    <RatingStars
                        rating={userRating || 0} // Pass current user's rating, or 0 if not rated
                        onRatingChange={handleRatingSubmit} // Callback for when user changes rating
                        readOnly={isRatingSubmitting} // Disable interaction while submitting
                    />
                    {/* Show spinner while rating is being submitted */}
                    {isRatingSubmitting && <Spinner size="sm" />}
                </div>
                {/* Favorite Button */}
                <Button
                    onClick={handleToggleFavorite}
                    disabled={isFavoriteSubmitting} // Disable while favorite status is being updated
                    variant={isFavorite ? "secondary" : "primary"} // Change style based on favorite status
                    className={detailStyles.favoriteButton}
                >
                    {/* Show spinner or text based on submission status and current favorite state */}
                    {isFavoriteSubmitting ? <Spinner size="sm"/> : (isFavorite ? 'Unfavorite' : 'Favorite')}
                </Button>
            </div>
            )}

            {/* Ingredients List */}
            <h4>Ingredients:</h4>
            <ul className={detailStyles.ingredientList}>
            {cocktail.ingredients.map(item => (
                <li key={item.ingredient.id}>
                {item.ingredient.name}: {item.amount} {item.unit}
                </li>
            ))}
            </ul>

            {/* Instructions */}
            <h4>Instructions:</h4>
            <p className={detailStyles.instructions}>{cocktail.instructions}</p>

            {/* Tags List - display if tags exist */}
            {cocktail.tags && cocktail.tags.length > 0 && (
            <>
                <h4>Tags:</h4>
                <div className={detailStyles.tagList}>
                {cocktail.tags.map(tag => (
                    <span key={tag.id} className={detailStyles.tag}>{tag.name}</span>
                ))}
                </div>
            </>
            )}
            {/* Meta Information: Owner and Last Updated Date */}
            <p className={detailStyles.metaInfo}>
                {/* Displaying owner_id directly; consider fetching username if available */}
                Added by: User ID {cocktail.owner_id} |
                Last updated: {new Date(cocktail.updated_at).toLocaleDateString()}
            </p>
        </div>
      </div>
      {/* Link to navigate back to the cocktail list page */}
      <Link to="/" className={styles.backLink}>Back to list</Link>
    </div>
  );
};

export default CocktailDetailPage;