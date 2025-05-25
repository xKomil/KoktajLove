// CocktailCard.tsx - Poprawiona wersja z nowym fallback obrazkiem
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CocktailWithDetails, Tag } from '@/types/cocktailTypes';
import RatingStars from './RatingStars';
import Button from '@/components/ui/Button/Button';
import styles from './CocktailCard.module.css';

interface CocktailCardProps {
  cocktail: CocktailWithDetails;
  showNewBadge?: boolean;
  onCardClick?: (cocktail: CocktailWithDetails) => void;
  className?: string;
}

const CocktailCard: React.FC<CocktailCardProps> = ({ 
  cocktail, 
  showNewBadge = false,
  onCardClick,
  className = ''
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState<string>('');
  
  // URL dla fallback obrazka - konkretny obrazek koktajlu zamiast placeholder
  const fallbackImageUrl = 'https://img.freepik.com/premium-vector/socktail-mocktail-drink-glass-with-high-stem-alcoholic-nonalcoholic-cocktail-sketch_106796-4466.jpg?w=360';
  const localFallbackUrl = '/assets/default-cocktail.png';

  // Inicjalizacja źródła obrazka
  useEffect(() => {
    if (cocktail.image_url && cocktail.image_url.trim() !== '') {
      setCurrentSrc(cocktail.image_url);
      setImageState('loading');
    } else {
      setCurrentSrc(fallbackImageUrl);
      setImageState('loaded');
    }
  }, [cocktail.id, cocktail.image_url, fallbackImageUrl]);

  // Obsługa błędów ładowania obrazka
  const handleImageError = useCallback(() => {
    if (currentSrc === cocktail.image_url) {
      // Pierwszy fallback - obrazek truskawkowego koktajlu
      console.warn(`Failed to load original image: ${cocktail.image_url}`);
      setCurrentSrc(fallbackImageUrl);
    } else if (currentSrc === fallbackImageUrl) {
      // Drugi fallback - lokalny obrazek (jeśli istnieje)
      console.warn('Failed to load fallback image, trying local fallback');
      setCurrentSrc(localFallbackUrl);
    } else {
      // Ostateczny fallback nie zadziałał - pokaż placeholder div
      console.error('All image sources failed to load');
      setImageState('error');
    }
  }, [currentSrc, cocktail.image_url, fallbackImageUrl, localFallbackUrl]);

  // Obsługa pomyślnego załadowania obrazka
  const handleImageLoad = useCallback(() => {
    setImageState('loaded');
  }, []);

  // Obsługa kliknięcia w kartę
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Zapobiegaj propagacji jeśli kliknięto w button
    if ((e.target as HTMLElement).closest('button, a')) {
      return;
    }
    
    if (onCardClick) {
      onCardClick(cocktail);
    }
  }, [onCardClick, cocktail]);

  // Obsługa klawiatury dla dostępności
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onCardClick) {
        onCardClick(cocktail);
      }
    }
  }, [onCardClick, cocktail]);

  // Przygotowanie opisu z intelligent truncation
  const truncateDescription = (text: string, maxLength: number = 120): string => {
    if (text.length <= maxLength) return text;
    
    // Znajdź ostatnią spację przed limitem
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > maxLength * 0.8 
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...';
  };

  const description = cocktail.description || "No description available.";
  const displayDescription = truncateDescription(description);

  // Ograniczenie tagów do wyświetlenia
  const maxVisibleTags = 3;
  const visibleTags = cocktail.tags?.slice(0, maxVisibleTags) || [];
  const remainingTagsCount = (cocktail.tags?.length || 0) - maxVisibleTags;

  return (
    <article 
      className={`${styles.card} ${imageState === 'loading' ? styles.loading : ''} ${className}`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={onCardClick ? 0 : -1}
      role={onCardClick ? "button" : undefined}
      aria-label={`Cocktail: ${cocktail.name}`}
    >
      {/* Badge dla nowych koktajli */}
      {showNewBadge && (
        <div className={styles.newBadge} aria-label="New cocktail">
          NEW
        </div>
      )}

      {/* Kontener obrazka */}
      <div className={styles.imageContainer}>
        {imageState === 'error' ? (
          <div className={styles.imagePlaceholder} role="img" aria-label="Image not available">
            🍹 Image not available
          </div>
        ) : (
          <>
            <img
              src={currentSrc || fallbackImageUrl}
              alt={`${cocktail.name} cocktail`}
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

      {/* Główna treść */}
      <div className={styles.content}>
        <h3 className={styles.name}>
          {cocktail.name}
        </h3>

        <p className={styles.description}>
          {displayDescription}
        </p>

        {/* Metadata (rating, tagi) */}
        <div className={styles.metadata}>
          {/* Rating */}
          {(cocktail.average_rating !== undefined && cocktail.average_rating !== null) && (
            <div className={styles.ratingContainer}>
              <RatingStars 
                rating={cocktail.average_rating} 
                readOnly 
                size="small"
                aria-label={`Rating: ${cocktail.average_rating} out of 5 stars`}
              />
              <span className={styles.ratingText} aria-hidden="true">
                ({cocktail.average_rating.toFixed(1)})
              </span>
            </div>
          )}

          {/* Tagi */}
          {visibleTags.length > 0 && (
            <div className={styles.tagsContainer} role="list" aria-label="Cocktail tags">
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
                  title={`${remainingTagsCount} more tags`}
                >
                  +{remainingTagsCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Przycisk akcji */}
        <div className={styles.actionContainer}>
          <Button
            as="link"
            to={`/cocktail/${cocktail.id}`}
            variant="primary"
            size="sm"
            className={styles.detailsButton}
            aria-label={`View details for ${cocktail.name}`}
          >
            View Details
          </Button>
        </div>
      </div>
    </article>
  );
};

export default CocktailCard;