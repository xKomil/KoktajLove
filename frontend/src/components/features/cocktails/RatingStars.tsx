import React, { useState, useCallback, KeyboardEvent } from 'react';
import { Star } from 'lucide-react'; // Icon component
import styles from './RatingStars.module.css'; // CSS module for styling

/**
 * Interface for the RatingStars component's props.
 */
interface RatingStarsProps {
  rating: number; // Current rating value (e.g., 0-5)
  maxRating?: number; // Maximum possible rating (number of stars)
  onRatingChange?: (newRating: number) => void; // Callback when the rating is changed by the user
  readOnly?: boolean; // If true, the rating cannot be changed
  size?: 'small' | 'medium' | 'large'; // Size of the stars
  showTooltip?: boolean; // If true, displays a tooltip on hover/focus
}

/**
 * RatingStars component.
 * Displays a set of stars for rating, allowing user interaction if not read-only.
 * Supports keyboard navigation and ARIA attributes for accessibility.
 */
const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  onRatingChange,
  readOnly = false,
  size = 'medium',
  showTooltip = false,
}) => {
  // State for the rating value when hovering over a star
  const [hoverRating, setHoverRating] = useState(0);
  // State for the currently focused star index for keyboard navigation
  const [focusedIndex, setFocusedIndex] = useState(0);

  /**
   * Handles mouse over a star.
   * Updates hoverRating if the component is not read-only.
   */
  const handleMouseOver = useCallback((index: number) => {
    if (!readOnly) {
      setHoverRating(index);
    }
  }, [readOnly]);

  /**
   * Handles mouse leaving the star container.
   * Resets hoverRating if the component is not read-only.
   */
  const handleMouseLeave = useCallback(() => {
    if (!readOnly) {
      setHoverRating(0);
    }
  }, [readOnly]);

  /**
   * Handles clicking a star.
   * Calls onRatingChange with the new rating if not read-only and callback is provided.
   */
  const handleClick = useCallback((index: number) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(index);
    }
  }, [readOnly, onRatingChange]);

  /**
   * Handles keyboard events for accessibility.
   * Allows navigation (Arrow keys, Home, End) and selection (Enter, Space).
   */
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (readOnly) return;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp': // Common alternative for sliders
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, maxRating));
        break;
      case 'ArrowLeft':
      case 'ArrowDown': // Common alternative for sliders
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 1)); // Min focus is 1 star
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

  /**
   * Generates tooltip text for a given star value.
   */
  const getTooltipText = (starValue: number): string => {
    const labels = ['Terrible', 'Poor', 'Average', 'Good', 'Great']; // English labels for 1-5 stars
    return labels[starValue - 1] || `${starValue} ${starValue === 1 ? 'star' : 'stars'}`;
  };

  // Determine the rating to display (hovered or actual)
  const currentDisplayRating = hoverRating || rating;

  /**
   * Determines the fill state of a star (empty, partial, full).
   * Handles partial fills for non-integer ratings.
   */
  const getStarFillState = (starIndex: number): 'empty' | 'partial' | 'full' => {
    const starValue = starIndex + 1;
    if (currentDisplayRating >= starValue) {
      return 'full';
    } else if (currentDisplayRating > starIndex && currentDisplayRating < starValue) {
      return 'partial'; // Star is partially filled
    }
    return 'empty';
  };

  return (
    <div
      className={`${styles.ratingContainer} ${styles[size]} ${readOnly ? styles.readOnly : styles.interactive}`}
      role={readOnly ? "img" : "slider"} // ARIA role: 'img' for read-only, 'slider' for interactive
      aria-label={readOnly ? `Rating: ${rating} out of ${maxRating} ${maxRating === 1 ? 'star' : 'stars'}` : `Rate from 1 to ${maxRating} ${maxRating === 1 ? 'star' : 'stars'}`}
      aria-valuenow={readOnly ? rating : focusedIndex || rating} // Current value for ARIA slider
      aria-valuemin={1} // Minimum value for ARIA slider
      aria-valuemax={maxRating} // Maximum value for ARIA slider
      aria-readonly={readOnly} // Indicates if the slider is read-only
      tabIndex={readOnly ? -1 : 0} // Make interactive container focusable
      onKeyDown={handleKeyDown}
      onMouseLeave={handleMouseLeave}
    >
      {[...Array(maxRating)].map((_, i) => {
        const starValue = i + 1;
        const fillState = getStarFillState(i);
        // A star is considered "focused" for styling if it matches the keyboard-navigated focusedIndex
        const isKeyboardFocused = !readOnly && starValue === focusedIndex;

        return (
          <button
            key={starValue}
            type="button"
            className={`${styles.starButton} ${styles[fillState]} ${isKeyboardFocused ? styles.focused : ''}`}
            onMouseOver={() => handleMouseOver(starValue)}
            onClick={() => handleClick(starValue)}
            disabled={readOnly}
            // ARIA label for individual star buttons (for interactive mode)
            aria-label={readOnly ? undefined : `Rate ${starValue} ${starValue === 1 ? 'star' : 'stars'}`}
            // Title attribute for tooltip (if enabled)
            title={showTooltip && !readOnly ? getTooltipText(starValue) : undefined}
            tabIndex={-1} // Individual buttons are not focusable; navigation is handled by the container
          >
            <Star
              className={styles.starIcon}
              // Apply fill based on state: full, partial (using SVG gradient), or none
              fill={fillState === 'full' ? 'currentColor' : fillState === 'partial' ? 'url(#partialFill)' : 'none'}
              strokeWidth={1.5} // Stroke width for the star outline
            />
            {/* SVG definition for partial fill gradient, only rendered if a partial fill is needed */}
            {fillState === 'partial' && (
              <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                  <linearGradient id="partialFill" x1="0%" y1="0%" x2="100%" y2="0%">
                    {/* Gradient stops define the filled and unfilled parts of the star */}
                    <stop offset={`${(currentDisplayRating % 1) * 100}%`} stopColor="currentColor" />
                    <stop offset={`${(currentDisplayRating % 1) * 100}%`} stopColor="var(--star-empty-color, transparent)" /> {/* Use CSS var or fallback */}
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