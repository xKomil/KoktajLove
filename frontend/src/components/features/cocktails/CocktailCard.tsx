// CocktailCard.tsx - Enhanced version with better favorite state handling
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react'; // Icon component
import { CocktailWithDetails, Tag } from '@/types/cocktailTypes'; // TypeScript types
import { useAuth } from '@/hooks/useAuth'; // Authentication hook
import * as favoriteService from '@/services/favoriteService'; // Service for favorite operations
import RatingStars from './RatingStars'; // Component to display star ratings
import Button from '@/components/ui/Button/Button'; // UI Button component
import styles from './CocktailCard.module.css'; // CSS module for styling

/**
 * Interface for CocktailCard component props.
 */
interface CocktailCardProps {
  cocktail: CocktailWithDetails; // The cocktail data to display
  showNewBadge?: boolean; // Optional flag to show a "NEW" badge
  onCardClick?: (cocktail: CocktailWithDetails) => void; // Optional callback when the card is clicked
  onFavoriteChange?: (cocktailId: number, isFavorite: boolean) => void; // New: callback for favorite status changes
  className?: string; // Optional additional CSS class names
}

const CocktailCard: React.FC<CocktailCardProps> = ({
  cocktail,
  showNewBadge = false,
  onCardClick,
  onFavoriteChange,
  className = ''
}) => {
  const { isAuthenticated } = useAuth(); // Get authentication status
  const location = useLocation(); // Get current location for context-specific logic
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading'); // State for image loading status
  const [currentSrc, setCurrentSrc] = useState<string>(''); // Current image source URL
  const [isFavorite, setIsFavorite] = useState<boolean>(false); // State for whether the cocktail is a favorite
  const [isTogglingFavorite, setIsTogglingFavorite] = useState<boolean>(false); // State for favorite toggle operation loading
  const [favoriteError, setFavoriteError] = useState<string | null>(null); // State for errors during favorite operations

  // Fallback image URLs
  const fallbackImageUrl = 'https://img.freepik.com/premium-vector/socktail-mocktail-drink-glass-with-high-stem-alcoholic-nonalcoholic-cocktail-sketch_106796-4466.jpg?w=360';
  const localFallbackUrl = '/assets/default-cocktail.png'; // Assumes this asset exists in public/assets

  // Initialize image source when cocktail data changes
  useEffect(() => {
    if (cocktail.image_url && cocktail.image_url.trim() !== '') {
      setCurrentSrc(cocktail.image_url);
      setImageState('loading');
    } else {
      setCurrentSrc(fallbackImageUrl); // Use primary fallback if no image_url
      setImageState('loaded'); // Assume fallback loads or is a placeholder
    }
  }, [cocktail.id, cocktail.image_url, fallbackImageUrl]);

  // Check if cocktail is a favorite when component mounts or auth status/cocktail ID changes
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!isAuthenticated) {
        setIsFavorite(false); // Not authenticated, so not a favorite
        return;
      }

      try {
        const response = await favoriteService.isCocktailFavorite(cocktail.id);
        setIsFavorite(response.is_favorite);
        setFavoriteError(null);
      } catch (error) {
        console.warn('Failed to check favorite status:', error);
        setIsFavorite(false); // Default to not favorite on error
        // Don't set a visible error for this initial check, as it's not critical for card display
      }
    };

    checkFavoriteStatus();
  }, [cocktail.id, isAuthenticated]);

  // Handle image loading errors with a fallback chain
  const handleImageError = useCallback(() => {
    setImageState('error'); // Set error state first
    if (currentSrc === cocktail.image_url) {
      console.warn(`Failed to load original image: ${cocktail.image_url}, trying fallback.`);
      setCurrentSrc(fallbackImageUrl);
    } else if (currentSrc === fallbackImageUrl) {
      console.warn('Failed to load fallback image, trying local fallback.');
      setCurrentSrc(localFallbackUrl);
    } else {
      // This means localFallbackUrl also failed or was the last resort
      console.error('All image sources failed to load.');
      // ImageState is already 'error', currentSrc will be the last tried one
    }
  }, [currentSrc, cocktail.image_url, fallbackImageUrl, localFallbackUrl]);

  // Handle successful image load
  const handleImageLoad = useCallback(() => {
    setImageState('loaded');
  }, []);

  // Handle card click action
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Prevent click propagation if the click originated from a button or link within the card
    if ((e.target as HTMLElement).closest('button, a')) {
      return;
    }

    if (onCardClick) {
      onCardClick(cocktail);
    }
  }, [onCardClick, cocktail]);

  // Handle keyboard navigation (Enter/Space) for accessibility on the card
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); // Prevent default space scroll or enter form submission
      if (onCardClick) {
        onCardClick(cocktail);
      }
    }
  }, [onCardClick, cocktail]);

  // Handle toggling the favorite status of the cocktail
  const handleToggleFavorite = useCallback(async () => {
    if (!isAuthenticated || isTogglingFavorite) {
      return; // Do nothing if not authenticated or already processing
    }

    setIsTogglingFavorite(true);
    setFavoriteError(null); // Clear previous errors

    try {
      const newFavoriteState = !isFavorite;

      if (isFavorite) {
        await favoriteService.removeCocktailFromFavorites(cocktail.id);
      } else {
        await favoriteService.addCocktailToFavorites(cocktail.id);
      }

      setIsFavorite(newFavoriteState);

      // Notify parent component about the favorite status change
      if (onFavoriteChange) {
        onFavoriteChange(cocktail.id, newFavoriteState);
      }

      // Specific behavior if on the "My Favorites" page and an item was removed
      if (location.pathname === '/my-favorites' && !newFavoriteState) {
        // Optional: Show a toast notification or similar feedback
        console.log('Cocktail removed from favorites on favorites page.');
      }

    } catch (error: any) {
      console.error('Error toggling favorite:', error);

      // Set a user-friendly error message
      let errorMessage = 'An error occurred while updating favorites.';
      if (error.response?.status === 404) {
        errorMessage = 'Cocktail not found.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.detail || 'Invalid request.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
      }

      setFavoriteError(errorMessage);

      // Clear the error message after a few seconds
      setTimeout(() => setFavoriteError(null), 5000);
    } finally {
      setIsTogglingFavorite(false);
    }
  }, [isAuthenticated, isTogglingFavorite, isFavorite, cocktail.id, onFavoriteChange, location.pathname]);

  // Prepare description with intelligent truncation
  const truncateDescription = (text: string, maxLength: number = 120): string => {
    if (text.length <= maxLength) return text;

    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    // Prefer truncating at a word boundary if it's reasonably close to maxLength
    return lastSpace > maxLength * 0.8
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...';
  };

  const description = cocktail.description || "No cocktail description available.";
  const displayDescription = truncateDescription(description);

  // Limit the number of tags displayed directly on the card
  const maxVisibleTags = 3;
  const visibleTags = cocktail.tags?.slice(0, maxVisibleTags) || [];
  const remainingTagsCount = (cocktail.tags?.length || 0) - maxVisibleTags;

  // Rating display logic
  const hasRating = cocktail.average_rating !== null && cocktail.average_rating !== undefined;
  const ratingsCount = cocktail.ratings_count || 0;

  // Format ratings count (e.g., "1 rating", "5 ratings")
  const formatRatingsCount = (count: number): string => {
    if (count === 0) return 'No ratings';
    if (count === 1) return '1 rating';
    return `${count} ratings`;
  };

  return (
    <article
      className={`${styles.card} ${imageState === 'loading' ? styles.loading : ''} ${className}`}
      onClick={onCardClick ? handleCardClick : undefined} // Only attach click handler if callback provided
      onKeyDown={onCardClick ? handleKeyDown : undefined} // Only attach keydown handler if callback provided
      tabIndex={onCardClick ? 0 : -1} // Make card focusable if clickable
      role={onCardClick ? "button" : undefined} // ARIA role
      aria-label={`Cocktail: ${cocktail.name}`}
    >
      {/* "NEW" badge, if applicable */}
      {showNewBadge && (
        <div className={styles.newBadge} aria-label="New cocktail">
          NEW
        </div>
      )}

      {/* Favorite button - only shown to authenticated users */}
      {isAuthenticated && (
        <button
          className={`${styles.favoriteButton} ${isFavorite ? styles.favoriteActive : ''} ${isTogglingFavorite ? styles.favoriteLoading : ''}`}
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click when favorite button is clicked
            handleToggleFavorite();
          }}
          disabled={isTogglingFavorite}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={isFavorite} // Indicates the current state of the toggle button
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            size={20}
            fill={isFavorite ? "currentColor" : "none"} // Fill heart icon if favorited
            className={styles.heartIcon}
          />
          {/* Loading spinner for favorite toggle */}
          {isTogglingFavorite && <div className={styles.favoriteSpinner} />}
        </button>
      )}

      {/* Error message display for favorite operations */}
      {favoriteError && (
        <div className={styles.favoriteError} role="alert">
          {favoriteError}
        </div>
      )}

      {/* Image container with loading/error states */}
      <div className={styles.imageContainer}>
        {imageState === 'error' ? (
          <div className={styles.imagePlaceholder} role="img" aria-label="Image not available">
            🍹 {/* Placeholder icon */}
            <span>No image</span>
          </div>
        ) : (
          <>
            <img
              src={currentSrc} // Use currentSrc which handles fallbacks
              alt={`Cocktail ${cocktail.name}`}
              className={styles.image}
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy" // Lazy load images for performance
              decoding="async" // Asynchronous image decoding
            />
            <div className={styles.imageOverlay} aria-hidden="true" /> {/* Optional overlay for styling */}
          </>
        )}
      </div>

      {/* Main content area of the card */}
      <div className={styles.content}>
        {/* Cocktail name */}
        <h3 className={styles.name}>
          {cocktail.name}
        </h3>

        {/* Truncated description */}
        <p className={styles.description}>
          {displayDescription}
        </p>

        {/* Metadata section (ratings, tags) */}
        <div className={styles.metadata}>
          {/* Rating section */}
          <div className={styles.ratingSection}>
            {hasRating && ratingsCount > 0 ? (
              <div className={styles.ratingContainer}>
                <RatingStars
                  rating={cocktail.average_rating!} // Non-null assertion as per hasRating
                  readOnly
                  size="small"
                  aria-label={`Rating: ${cocktail.average_rating!.toFixed(1)} out of 5 stars`}
                />
                <span className={styles.ratingText}>
                  ({cocktail.average_rating!.toFixed(1)})
                </span>
                <span className={styles.ratingsCount}>
                  {formatRatingsCount(ratingsCount)}
                </span>
              </div>
            ) : (
              <div className={styles.noRatingContainer}>
                <span className={styles.noRatingText}>
                  {formatRatingsCount(ratingsCount)} {/* Will show "No ratings" if count is 0 */}
                </span>
              </div>
            )}
          </div>

          {/* Tags section - displays a limited number of tags */}
          {visibleTags.length > 0 && (
            <div className={styles.tagsContainer} role="list" aria-label="Cocktail tags">
              {visibleTags.map((tag: Tag) => (
                <span
                  key={tag.id}
                  className={styles.tag}
                  role="listitem"
                  title={tag.name} // Show full tag name on hover
                >
                  {tag.name}
                </span>
              ))}
              {/* Display count of remaining tags if any */}
              {remainingTagsCount > 0 && (
                <span
                  className={styles.tag}
                  role="listitem"
                  title={`${remainingTagsCount} more ${remainingTagsCount === 1 ? 'tag' : 'tags'}`}
                >
                  +{remainingTagsCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action button (e.g., "View Details") */}
        <div className={styles.actionContainer}>
          <Button
            as="link" // Renders as a React Router Link
            to={`/cocktails/${cocktail.id}`}
            variant="primary"
            size="sm"
            className={styles.detailsButton}
            aria-label={`View details for cocktail ${cocktail.name}`}
          >
            View Details
          </Button>
        </div>
      </div>
    </article>
  );
};

export default CocktailCard;