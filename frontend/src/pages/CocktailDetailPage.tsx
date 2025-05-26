// frontend/src/pages/CocktailDetailPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Edit3, Trash2 } from 'lucide-react';
import * as cocktailService from '@/services/cocktailService';
import { CocktailWithDetails, Rating } from '@/types';
import Spinner from '@/components/ui/Spinner/Spinner';
import Button from '@/components/ui/Button/Button';
import RatingStars from '@/components/features/cocktails/RatingStars';
import { useAuth } from '@/hooks/useAuth';
import * as ratingService from '@/services/ratingService';
import * as favoriteService from '@/services/favoriteService';
import styles from './PageStyles.module.css';
import detailStyles from './CocktailDetailPage.module.css';

/**
 * CocktailDetailPage component.
 * Displays detailed information about a specific cocktail, allows users to rate it,
 * add/remove it from favorites, and edit/delete it if they are the owner.
 */
const CocktailDetailPage: React.FC = () => {
  const { cocktailId } = useParams<{ cocktailId: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Main component state
  const [cocktail, setCocktail] = useState<CocktailWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rating-related state
  const [userRatingObject, setUserRatingObject] = useState<Rating | null>(null);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  const [isDeletingRating, setIsDeletingRating] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  // Favorite-related state
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteSubmitting, setIsFavoriteSubmitting] = useState(false);

  /**
   * Fetches cocktail details, user's rating, and favorite status.
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
          const ratingData = await ratingService.getUserRatingForCocktail(data.id, user.id);
          setUserRatingObject(ratingData);
        } catch (ratingError: any) {
          if (ratingError.response?.status !== 404) {
            console.warn('Could not fetch user rating:', ratingError);
          }
          setUserRatingObject(null);
        }

        // Fetch favorite status for this cocktail
        try {
          const favStatus = await favoriteService.isCocktailFavorite(data.id);
          setIsFavorite(favStatus.is_favorite);
        } catch (favError) {
          console.warn('Could not fetch favorite status:', favError);
          setIsFavorite(false);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch cocktail details:', err);
      setError(err.response?.data?.detail || 'Failed to load cocktail details.');
    } finally {
      setIsLoading(false);
    }
  }, [cocktailId, isAuthenticated, user]);

  useEffect(() => {
    fetchCocktailDetails();
  }, [fetchCocktailDetails]);

  /**
   * Handles the submission of a new rating or update of existing rating by the user.
   */
  const handleRatingSubmit = async (newRating: number) => {
    if (!cocktail || !isAuthenticated || !user) return;

    setIsRatingSubmitting(true);
    setRatingError(null);

    try {
      let updatedRating: Rating;

      if (userRatingObject && userRatingObject.id) {
        // Update existing rating
        updatedRating = await ratingService.updateRating(userRatingObject.id, { score: newRating });
      } else {
        // Create new rating
        updatedRating = await ratingService.createRating({
          cocktail_id: cocktail.id,
          score: newRating
        });
      }

      setUserRatingObject(updatedRating);
      // Re-fetch cocktail details to update the average rating
      await fetchCocktailDetails();
    } catch (err: any) {
      console.error('Failed to submit rating:', err);
      
      // Handle specific error cases
      if (err.response?.status === 403) {
        setRatingError('You cannot rate your own cocktails.');
      } else if (err.response?.data?.detail) {
        setRatingError(err.response.data.detail);
      } else {
        setRatingError('Could not submit your rating. Please try again.');
      }
    } finally {
      setIsRatingSubmitting(false);
    }
  };

  /**
   * Handles the deletion of user's own rating.
   */
  const handleDeleteRating = async () => {
    if (!userRatingObject || !cocktail) return;

    if (!window.confirm('Are you sure you want to delete your rating?')) {
      return;
    }

    setIsDeletingRating(true);
    setRatingError(null);

    try {
      await ratingService.deleteRating(userRatingObject.id);
      setUserRatingObject(null);
      setRatingError(null);
      // Re-fetch cocktail details to update the average rating
      await fetchCocktailDetails();
    } catch (err: any) {
      console.error('Failed to delete rating:', err);
      
      if (err.response?.data?.detail) {
        setRatingError(err.response.data.detail);
      } else {
        setRatingError('Could not delete your rating. Please try again.');
      }
    } finally {
      setIsDeletingRating(false);
    }
  };

  /**
   * Toggles the favorite status of the cocktail for the authenticated user.
   */
  const handleToggleFavorite = async () => {
    if (!cocktail || !isAuthenticated) return;

    setIsFavoriteSubmitting(true);

    try {
      if (isFavorite) {
        await favoriteService.removeCocktailFromFavorites(cocktail.id);
        setIsFavorite(false);
      } else {
        await favoriteService.addCocktailToFavorites(cocktail.id);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Failed to update favorite status:', err);
      // For now, we'll just log the error. You could add a state for favorite errors if needed.
    } finally {
      setIsFavoriteSubmitting(false);
    }
  };

  /**
   * Handles the deletion of the cocktail.
   */
  const handleDeleteCocktail = async () => {
    if (!cocktail) return;

    if (!window.confirm(`Are you sure you want to delete "${cocktail.name}"?`)) {
      return;
    }

    try {
      await cocktailService.deleteCocktail(cocktail.id);
      navigate('/cocktails');
    } catch (err: any) {
      console.error('Failed to delete cocktail:', err);
      setError(err.response?.data?.detail || 'Could not delete cocktail. Please try again.');
    }
  };

  /**
   * Clears rating error after a delay
   */
  useEffect(() => {
    if (ratingError) {
      const timer = setTimeout(() => {
        setRatingError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [ratingError]);

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.pageContainer}>
        <div className={detailStyles.loadingContainer}>
          <Spinner />
          <p>Loading cocktail...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${styles.pageContainer} ${detailStyles.errorContainer}`}>
        <div className={detailStyles.errorMessage}>
          <h2>Error</h2>
          <p>{error}</p>
          <Button onClick={() => fetchCocktailDetails()} variant="primary">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // No cocktail found
  if (!cocktail) {
    return (
      <div className={styles.pageContainer}>
        <div className={detailStyles.notFoundContainer}>
          <h2>Cocktail not found</h2>
          <p>The cocktail you're looking for doesn't exist or has been removed.</p>
          <Link to="/cocktails" className={detailStyles.backLink}>
            Back to cocktails
          </Link>
        </div>
      </div>
    );
  }

  // Determine if the current authenticated user is the owner of the cocktail
  const isOwner = isAuthenticated && user && cocktail && user.id === cocktail.user_id;
  const placeholderImage = 'https://img.freepik.com/premium-vector/socktail-mocktail-drink-glass-with-high-stem-alcoholic-nonalcoholic-cocktail-sketch_106796-4466.jpg?w=360';

  return (
    <div className={`${styles.pageContainer} ${detailStyles.cocktailDetailContainer}`}>
      {/* Header section */}
      <div className={detailStyles.header}>
        <div className={detailStyles.titleSection}>
          <h1 className={detailStyles.cocktailName}>{cocktail.name}</h1>
          {cocktail.author && (
            <p className={detailStyles.authorInfo}>
              Created by <span className={detailStyles.authorName}>{cocktail.author.username}</span>
            </p>
          )}
        </div>
        {isOwner && (
          <div className={detailStyles.ownerActions}>
            <Button
              as="link"
              to={`/edit-cocktail/${cocktail.id}`}
              variant="secondary"
              size="sm"
              leftIcon={<Edit3 size={16} />}
              className={`${detailStyles.customActionButton} customActionButton`}
            >
              Edit
            </Button>
            <Button
              onClick={handleDeleteCocktail}
              variant="danger"
              size="sm"
              leftIcon={<Trash2 size={16} />}
              className={`${detailStyles.customActionButton} customActionButton`}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className={detailStyles.mainContent}>
        <div className={detailStyles.imageContainer}>
          <img
            src={cocktail.image_url || placeholderImage}
            alt={cocktail.name}
            className={detailStyles.cocktailImage}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = placeholderImage;
            }}
          />
        </div>

        <div className={detailStyles.infoContainer}>
          <div className={detailStyles.description}>
            <h3>Description</h3>
            <p>{cocktail.description || 'No description available.'}</p>
          </div>

          {/* Average Rating Section */}
          <div className={detailStyles.averageRatingSection}>
            <h3>Average Rating</h3>
            {cocktail.average_rating !== null && cocktail.average_rating !== undefined ? (
              <div className={detailStyles.ratingDisplay}>
                <RatingStars rating={cocktail.average_rating} readOnly />
                <span className={detailStyles.ratingText}>
                  {cocktail.average_rating.toFixed(1)} / 5
                  {cocktail.ratings_count && (
                    <span className={detailStyles.ratingsCount}>
                      ({cocktail.ratings_count} rating{cocktail.ratings_count !== 1 ? 's' : ''})
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <p className={detailStyles.noRating}>Not rated yet.</p>
            )}
          </div>

          {/* User Interaction Section - only for authenticated users */}
          {isAuthenticated && (
            <div className={detailStyles.userInteractionSection}>
              {/* User's Own Rating Section */}
              <div className={detailStyles.userRatingSection}>
                <h4>Your Rating</h4>
                <div className={detailStyles.ratingControls}>
                  <RatingStars
                    rating={userRatingObject?.rating_value || 0}
                    onRatingChange={handleRatingSubmit}
                    readOnly={isRatingSubmitting || isDeletingRating}
                  />
                  {(isRatingSubmitting || isDeletingRating) && <Spinner size="sm" />}
                </div>
                {userRatingObject && (
                  <div className={detailStyles.deleteRatingContainer}>
                    <Button
                      onClick={handleDeleteRating}
                      disabled={isDeletingRating || isRatingSubmitting}
                      variant="danger"
                      size="sm"
                      leftIcon={<Trash2 size={16} />}
                      className={detailStyles.deleteRatingButton}
                    >
                      Delete Rating
                    </Button>
                  </div>
                )}
                {ratingError && (
                  <div className={detailStyles.ratingError}>
                    {ratingError}
                  </div>
                )}
              </div>

              {/* Favorite Button */}
              <div className={detailStyles.favoriteSection}>
                <Button
                  onClick={handleToggleFavorite}
                  disabled={isFavoriteSubmitting}
                  variant={isFavorite ? "secondary" : "primary"}
                  className={detailStyles.favoriteButton}
                  leftIcon={
                    isFavorite ? (
                      <Heart size={16} fill="currentColor" />
                    ) : (
                      <Heart size={16} />
                    )
                  }
                >
                  {isFavoriteSubmitting ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      {isFavorite ? 'Unfavorite' : 'Favorite'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Ingredients List */}
          <div className={detailStyles.ingredientsSection}>
            <h3>Ingredients</h3>
            {cocktail.ingredients && cocktail.ingredients.length > 0 ? (
              <ul className={detailStyles.ingredientsList}>
                {cocktail.ingredients.map((item, index) => (
                  <li key={item?.id || index} className={detailStyles.ingredientItem}>
                    <span className={detailStyles.ingredientName}>
                      {item?.name || 'Unknown ingredient'}
                    </span>
                    <span className={detailStyles.ingredientAmount}>
                      {item?.amount || 'N/A'} {item?.unit || ''}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={detailStyles.noData}>No ingredients available</p>
            )}
          </div>

          {/* Instructions */}
          <div className={detailStyles.instructionsSection}>
            <h3>Instructions</h3>
            <div className={detailStyles.instructions}>
              {cocktail.instructions ? (
                <p>{cocktail.instructions}</p>
              ) : (
                <p className={detailStyles.noData}>No instructions available.</p>
              )}
            </div>
          </div>

          {/* Tags List */}
          {cocktail.tags && cocktail.tags.length > 0 && (
            <div className={detailStyles.tagsSection}>
              <h3>Tags</h3>
              <div className={detailStyles.tagsList}>
                {cocktail.tags.map((tag, index) => (
                  <span key={tag?.id || index} className={detailStyles.tag}>
                    {tag?.name || 'Unknown tag'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Meta Information */}
          <div className={detailStyles.metaInfo}>
            <p className={detailStyles.metaItem}>
              Created: {new Date(cocktail.created_at).toLocaleDateString()}
            </p>
            {cocktail.updated_at && cocktail.updated_at !== cocktail.created_at && (
              <p className={detailStyles.metaItem}>
                Updated: {new Date(cocktail.updated_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className={detailStyles.navigation}>
        <Link to="/cocktails" className={detailStyles.backLink}>
          ← Back to cocktails
        </Link>
      </div>
    </div>
  );
};

export default CocktailDetailPage;