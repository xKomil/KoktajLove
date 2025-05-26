// frontend/src/components/ui/StarRatingInput/StarRatingInput.tsx
import React from 'react';
import { Star } from 'lucide-react'; // Import Star icon from lucide-react

interface StarRatingInputProps {
  value: number | null;
  onChange: (rating: number | null) => void;
  count?: number;
  size?: 'sm' | 'md' | 'lg'; // We can map this to Lucide icon size
  color?: string; // Inactive star color (border)
  activeColor?: string; // Active star color (fill and border) - deprecated, using gradient
  className?: string;
  label?: string;
  useGradient?: boolean; // New prop to enable gradient
}

const StarRatingInput: React.FC<StarRatingInputProps> = ({
  value,
  onChange,
  count = 5,
  size = 'md',
  color = '#9CA3AF', // CHANGE: Default gray (text-gray-400) for the inactive star border
  activeColor = '#764ba2', // Fallback color from gradient
  className = '',
  label,
  useGradient = true // Use gradient by default
}) => {
  // Map prop size to Lucide icon size (in pixels)
  const iconSizeMap = {
    sm: 16, // w-4 h-4
    md: 20, // w-5 h-5
    lg: 24  // w-6 h-6
  };
  const iconPixelSize = iconSizeMap[size];

  // Unique ID for defs in SVG (to avoid conflicts)
  // For ID stability per instance, React.useMemo can be used
  const gradientId = `star-gradient-${React.useMemo(() => Math.random().toString(36).substr(2, 9), [])}`;

  const handleStarClick = (rating: number) => {
    if (value === rating) {
      onChange(null); // Clear the filter if the same star is clicked
    } else {
      onChange(rating);
    }
  };

  const renderStar = (index: number) => {
    const ratingValue = index + 1;
    const isActive = value !== null && ratingValue <= value;

    return (
      <button
        key={index}
        type="button"
        onClick={() => handleStarClick(ratingValue)}
        className={`transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded p-0.5 hover:scale-110 hover:drop-shadow-md ${
          isActive ? 'transform hover:scale-125' : ''
        }`}
        aria-label={`${ratingValue} ${ratingValue === 1 ? 'star' : 'stars'}`}
        title={value === ratingValue ? 'Click to clear filter' : `Minimum rating: ${ratingValue}+`}
      >
        <div className="relative">
          <Star
            size={iconPixelSize}
            fill={isActive && useGradient ? `url(#${gradientId})` : isActive ? activeColor : 'gray'} // CHANGE: Inactive star has white fill (Note: code uses 'gray', comment might be outdated)
            stroke={isActive && useGradient ? `url(#${gradientId})` : isActive ? activeColor : color}
            strokeWidth={1.5}
            className={`transition-all duration-150 ${
              isActive ? 'drop-shadow-sm' : ''
            }`}
          />
          {/* Gradient definition - only when useGradient is true */}
          {useGradient && (
            <svg width="0" height="0" style={{ position: 'absolute' }}> {/* Using style for better SVG compatibility in flow */}
              <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="50%" stopColor="#764ba2" />
                  <stop offset="100%" stopColor="#f093fb" />
                </linearGradient>
              </defs>
            </svg>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="flex items-center space-x-1">
        {Array.from({ length: count }, (_, index) => renderStar(index))}
        {value !== null && (
          <span className="ml-2 text-sm text-gray-600">
            {/* You can add text here if needed */}
          </span>
        )}
      </div>
    </div>
  );
};

export default StarRatingInput;