import React, { useState, useCallback, KeyboardEvent } from 'react';
import { Star } from 'lucide-react';
import styles from './RatingStars.module.css';

interface RatingStarsProps {
  rating: number; // Current rating (0-5)
  maxRating?: number;
  onRatingChange?: (newRating: number) => void;
  readOnly?: boolean;
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
}

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  onRatingChange,
  readOnly = false,
  size = 'medium',
  showTooltip = false,
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleMouseOver = useCallback((index: number) => {
    if (!readOnly) {
      setHoverRating(index);
    }
  }, [readOnly]);

  const handleMouseLeave = useCallback(() => {
    if (!readOnly) {
      setHoverRating(0);
    }
  }, [readOnly]);

  const handleClick = useCallback((index: number) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(index);
    }
  }, [readOnly, onRatingChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (readOnly) return;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, maxRating));
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 1));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex > 0 && onRatingChange) {
          onRatingChange(focusedIndex);
        }
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(1);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(maxRating);
        break;
    }
  }, [readOnly, maxRating, focusedIndex, onRatingChange]);

  const getTooltipText = (starValue: number) => {
    const labels = ['Okropny', 'Słaby', 'Średni', 'Dobry', 'Świetny'];
    return labels[starValue - 1] || `${starValue} gwiazdek`;
  };

  const currentRating = hoverRating || rating;

  // Determine star fill state
  const getStarFillState = (starIndex: number): 'empty' | 'partial' | 'full' => {
    const starValue = starIndex + 1;
    if (currentRating >= starValue) {
      return 'full';
    } else if (currentRating > starIndex && currentRating < starValue) {
      return 'partial';
    }
    return 'empty';
  };

  return (
    <div
      className={`${styles.ratingContainer} ${styles[size]} ${readOnly ? styles.readOnly : styles.interactive}`}
      role={readOnly ? "img" : "slider"}
      aria-label={readOnly ? `Ocena: ${rating} z ${maxRating} gwiazdek` : `Oceń od 1 do ${maxRating} gwiazdek`}
      aria-valuenow={readOnly ? rating : focusedIndex}
      aria-valuemin={1}
      aria-valuemax={maxRating}
      aria-readonly={readOnly}
      tabIndex={readOnly ? -1 : 0}
      onKeyDown={handleKeyDown}
      onMouseLeave={handleMouseLeave}
    >
      {[...Array(maxRating)].map((_, i) => {
        const starValue = i + 1;
        const fillState = getStarFillState(i);
        const isFocused = !readOnly && starValue === focusedIndex;
        
        return (
          <button
            key={starValue}
            type="button"
            className={`${styles.starButton} ${styles[fillState]} ${isFocused ? styles.focused : ''}`}
            onMouseOver={() => handleMouseOver(starValue)}
            onClick={() => handleClick(starValue)}
            disabled={readOnly}
            aria-label={readOnly ? undefined : `Oceń ${starValue} ${starValue === 1 ? 'gwiazdkę' : 'gwiazdek'}`}
            title={showTooltip ? getTooltipText(starValue) : undefined}
            tabIndex={-1} // Navigation through container
          >
            <Star 
              className={styles.starIcon}
              fill={fillState === 'full' ? 'currentColor' : fillState === 'partial' ? 'url(#partialFill)' : 'none'}
              strokeWidth={1.5}
            />
            {/* SVG gradient for partial stars */}
            {fillState === 'partial' && (
              <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                  <linearGradient id="partialFill" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset={`${(currentRating % 1) * 100}%`} stopColor="currentColor" />
                    <stop offset={`${(currentRating % 1) * 100}%`} stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default RatingStars;