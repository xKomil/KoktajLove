// frontend/src/components/features/cocktails/RatingStars.tsx
import React, { useState } from 'react';
import styles from './RatingStars.module.css';

interface RatingStarsProps {
  rating: number; // Current rating (0-5)
  maxRating?: number;
  onRatingChange?: (newRating: number) => void;
  readOnly?: boolean;
  size?: 'small' | 'medium' | 'large'; // Optional size prop
}

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  onRatingChange,
  readOnly = false,
  size = 'medium',
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleMouseOver = (index: number) => {
    if (!readOnly) {
      setHoverRating(index);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverRating(0);
    }
  };

  const handleClick = (index: number) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(index);
    }
  };

  const getStarSizeStyle = () => {
    switch (size) {
      case 'small': return { fontSize: '1em' };
      case 'large': return { fontSize: '1.5em' };
      case 'medium':
      default: return { fontSize: '1.2em' };
    }
  };

  return (
    <div className={styles.starsContainer} style={getStarSizeStyle()}>
      {[...Array(maxRating)].map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= (hoverRating || rating);
        
        return (
          <span
            key={starValue}
            className={`${styles.star} ${isFilled ? styles.filled : ''} ${readOnly ? styles.readOnly : ''}`}
            onMouseOver={() => handleMouseOver(starValue)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(starValue)}
            role={readOnly ? undefined : "button"}
            aria-label={readOnly ? `${starValue} star` : `Rate ${starValue} star`}
            tabIndex={readOnly ? -1 : 0}
            onKeyDown={(e) => {
              if (!readOnly && (e.key === 'Enter' || e.key === ' ')) {
                handleClick(starValue);
              }
            }}
          >
            ★
          </span>
        );
      })}
    </div>
  );
};

export default RatingStars;