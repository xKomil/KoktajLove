import React, { useState, useCallback, KeyboardEvent } from 'react';
import styles from './RatingStars.module.css';

interface RatingStarsProps {
  rating: number; // Current rating (0-5)
  maxRating?: number;
  onRatingChange?: (newRating: number) => void;
  readOnly?: boolean;
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean; // Opcjonalne tooltips z tekstem oceny
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

  // SVG Star Component
  const StarIcon: React.FC<{ filled: boolean; focused: boolean }> = ({ filled, focused }) => (
    <svg
      viewBox="0 0 24 24"
      className={`${styles.starIcon} ${filled ? styles.filled : styles.empty} ${focused ? styles.focused : ''}`}
    >
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );

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
        const isFilled = starValue <= currentRating;
        const isFocused = !readOnly && starValue === focusedIndex;
        
        return (
          <button
            key={starValue}
            type="button"
            className={`${styles.starButton} ${isFilled ? styles.filledStar : styles.emptyStar}`}
            onMouseOver={() => handleMouseOver(starValue)}
            onClick={() => handleClick(starValue)}
            disabled={readOnly}
            aria-label={readOnly ? undefined : `Oceń ${starValue} ${starValue === 1 ? 'gwiazdkę' : 'gwiazdek'}`}
            title={showTooltip ? getTooltipText(starValue) : undefined}
            tabIndex={-1} // Nawigacja przez container
          >
            <StarIcon filled={isFilled} focused={isFocused} />
          </button>
        );
      })}
    </div>
  );
};

export default RatingStars;