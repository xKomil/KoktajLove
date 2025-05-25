// CocktailCard.tsx - Ulepszona wersja z lepszą obsługą stanu ulubionych
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { CocktailWithDetails, Tag } from '@/types/cocktailTypes';
import { useAuth } from '@/hooks/useAuth';
import * as favoriteService from '@/services/favoriteService';
import RatingStars from './RatingStars';
import Button from '@/components/ui/Button/Button';
import styles from './CocktailCard.module.css';

interface CocktailCardProps {
  cocktail: CocktailWithDetails;
  showNewBadge?: boolean;
  onCardClick?: (cocktail: CocktailWithDetails) => void;
  onFavoriteChange?: (cocktailId: number, isFavorite: boolean) => void; // Nowe: callback dla zmian ulubionych
  className?: string;
}

const CocktailCard: React.FC<CocktailCardProps> = ({ 
  cocktail, 
  showNewBadge = false,
  onCardClick,
  onFavoriteChange,
  className = ''
}) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState<boolean>(false);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  
  // Fallback images
  const fallbackImageUrl = 'https://img.freepik.com/premium-vector/socktail-mocktail-drink-glass-with-high-stem-alcoholic-nonalcoholic-cocktail-sketch_106796-4466.jpg?w=360';
  const localFallbackUrl = '/assets/default-cocktail.png';

  // Initialize image source
  useEffect(() => {
    if (cocktail.image_url && cocktail.image_url.trim() !== '') {
      setCurrentSrc(cocktail.image_url);
      setImageState('loading');
    } else {
      setCurrentSrc(fallbackImageUrl);
      setImageState('loaded');
    }
  }, [cocktail.id, cocktail.image_url, fallbackImageUrl]);

  // Check if cocktail is favorite when component mounts or auth status changes
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!isAuthenticated) {
        setIsFavorite(false);
        return;
      }

      try {
        const response = await favoriteService.isCocktailFavorite(cocktail.id);
        setIsFavorite(response.is_favorite);
        setFavoriteError(null);
      } catch (error) {
        console.warn('Failed to check favorite status:', error);
        setIsFavorite(false);
        // Don't set error for this, as it's not critical
      }
    };

    checkFavoriteStatus();
  }, [cocktail.id, isAuthenticated]);

  // Handle image loading errors with fallback chain
  const handleImageError = useCallback(() => {
    if (currentSrc === cocktail.image_url) {
      console.warn(`Failed to load original image: ${cocktail.image_url}`);
      setCurrentSrc(fallbackImageUrl);
    } else if (currentSrc === fallbackImageUrl) {
      console.warn('Failed to load fallback image, trying local fallback');
      setCurrentSrc(localFallbackUrl);
    } else {
      console.error('All image sources failed to load');
      setImageState('error');
    }
  }, [currentSrc, cocktail.image_url, fallbackImageUrl, localFallbackUrl]);

  // Handle successful image load
  const handleImageLoad = useCallback(() => {
    setImageState('loaded');
  }, []);

  // Handle card click
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Prevent propagation if clicked on button or link
    if ((e.target as HTMLElement).closest('button, a')) {
      return;
    }
    
    if (onCardClick) {
      onCardClick(cocktail);
    }
  }, [onCardClick, cocktail]);

  // Handle keyboard navigation for accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onCardClick) {
        onCardClick(cocktail);
      }
    }
  }, [onCardClick, cocktail]);

  // Handle toggle favorite
  const handleToggleFavorite = useCallback(async () => {
    if (!isAuthenticated || isTogglingFavorite) {
      return;
    }

    setIsTogglingFavorite(true);
    setFavoriteError(null);

    try {
      const newFavoriteState = !isFavorite;
      
      if (isFavorite) {
        await favoriteService.removeCocktailFromFavorites(cocktail.id);
      } else {
        await favoriteService.addCocktailToFavorites(cocktail.id);
      }
      
      setIsFavorite(newFavoriteState);
      
      // Notify parent component about the change
      if (onFavoriteChange) {
        onFavoriteChange(cocktail.id, newFavoriteState);
      }
      
      // If we're on the favorites page and item was removed, show success message
      if (location.pathname === '/my-favorites' && !newFavoriteState) {
        // Optional: Show a toast notification
        console.log('Cocktail removed from favorites');
      }
      
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      
      // Set user-friendly error message
      let errorMessage = 'Wystąpił błąd podczas aktualizacji ulubionych.';
      if (error.response?.status === 404) {
        errorMessage = 'Koktajl nie został znaleziony.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.detail || 'Nieprawidłowe żądanie.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Sesja wygasła. Zaloguj się ponownie.';
      }
      
      setFavoriteError(errorMessage);
      
      // Clear error after 5 seconds
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
    
    return lastSpace > maxLength * 0.8 
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...';
  };

  const description = cocktail.description || "Brak opisu koktajlu.";
  const displayDescription = truncateDescription(description);

  // Limit tags display
  const maxVisibleTags = 3;
  const visibleTags = cocktail.tags?.slice(0, maxVisibleTags) || [];
  const remainingTagsCount = (cocktail.tags?.length || 0) - maxVisibleTags;

  // Rating display logic
  const hasRating = cocktail.average_rating !== null && cocktail.average_rating !== undefined;
  const ratingsCount = cocktail.ratings_count || 0;

  // Format ratings count with proper Polish declension
  const formatRatingsCount = (count: number): string => {
    if (count === 0) return 'Brak ocen';
    if (count === 1) return '1 ocena';
    if (count >= 2 && count <= 4) return `${count} oceny`;
    return `${count} ocen`;
  };

  return (
    <article 
      className={`${styles.card} ${imageState === 'loading' ? styles.loading : ''} ${className}`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={onCardClick ? 0 : -1}
      role={onCardClick ? "button" : undefined}
      aria-label={`Koktajl: ${cocktail.name}`}
    >
      {/* New cocktail badge */}
      {showNewBadge && (
        <div className={styles.newBadge} aria-label="Nowy koktajl">
          NOWOŚĆ
        </div>
      )}

      {/* Favorite button - only for authenticated users */}
      {isAuthenticated && (
        <button
          className={`${styles.favoriteButton} ${isFavorite ? styles.favoriteActive : ''} ${isTogglingFavorite ? styles.favoriteLoading : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleFavorite();
          }}
          disabled={isTogglingFavorite}
          aria-label={isFavorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
          aria-pressed={isFavorite}
          title={isFavorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
        >
          <Heart 
            size={20} 
            fill={isFavorite ? "currentColor" : "none"} 
            className={styles.heartIcon}
          />
          {isTogglingFavorite && <div className={styles.favoriteSpinner} />}
        </button>
      )}

      {/* Error message for favorite operations */}
      {favoriteError && (
        <div className={styles.favoriteError} role="alert">
          {favoriteError}
        </div>
      )}

      {/* Image container */}
      <div className={styles.imageContainer}>
        {imageState === 'error' ? (
          <div className={styles.imagePlaceholder} role="img" aria-label="Obrazek niedostępny">
            🍹
            <span>Brak zdjęcia</span>
          </div>
        ) : (
          <>
            <img
              src={currentSrc || fallbackImageUrl}
              alt={`Koktajl ${cocktail.name}`}
              className={styles.image}
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy"
              decoding="async"
            />
            <div className={styles.imageOverlay} aria-hidden="true" />
          </>
        )}
      </div>

      {/* Main content */}
      <div className={styles.content}>
        {/* Cocktail name */}
        <h3 className={styles.name}>
          {cocktail.name}
        </h3>

        {/* Description */}
        <p className={styles.description}>
          {displayDescription}
        </p>

        {/* Metadata section */}
        <div className={styles.metadata}>
          {/* Rating section */}
          <div className={styles.ratingSection}>
            {hasRating && ratingsCount > 0 ? (
              <div className={styles.ratingContainer}>
                <RatingStars 
                  rating={cocktail.average_rating!} 
                  readOnly 
                  size="small"
                  aria-label={`Ocena: ${cocktail.average_rating!.toFixed(1)} z 5 gwiazdek`}
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
                  {formatRatingsCount(ratingsCount)}
                </span>
              </div>
            )}
          </div>

          {/* Tags section */}
          {visibleTags.length > 0 && (
            <div className={styles.tagsContainer} role="list" aria-label="Tagi koktajlu">
              {visibleTags.map((tag: Tag) => (
                <span 
                  key={tag.id} 
                  className={styles.tag}
                  role="listitem"
                  title={tag.name}
                >
                  {tag.name}
                </span>
              ))}
              {remainingTagsCount > 0 && (
                <span 
                  className={styles.tag}
                  role="listitem"
                  title={`Jeszcze ${remainingTagsCount} ${remainingTagsCount === 1 ? 'tag' : remainingTagsCount <= 4 ? 'tagi' : 'tagów'}`}
                >
                  +{remainingTagsCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action button */}
        <div className={styles.actionContainer}>
          <Button
            as="link"
            to={`/cocktails/${cocktail.id}`}
            variant="primary"
            size="sm"
            className={styles.detailsButton}
            aria-label={`Zobacz szczegóły koktajlu ${cocktail.name}`}
          >
            Zobacz Szczegóły
          </Button>
        </div>
      </div>
    </article>
  );
};

export default CocktailCard;