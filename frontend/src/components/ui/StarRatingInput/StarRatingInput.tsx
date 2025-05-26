// frontend/src/components/ui/StarRatingInput/StarRatingInput.tsx
import React from 'react';
import { Star } from 'lucide-react'; // Import ikony Star z lucide-react

interface StarRatingInputProps {
  value: number | null;
  onChange: (rating: number | null) => void;
  count?: number;
  size?: 'sm' | 'md' | 'lg'; // Możemy mapować to na rozmiar ikony Lucide
  color?: string; // Kolor nieaktywnej gwiazdki (obramowanie)
  activeColor?: string; // Kolor aktywnej gwiazdki (wypełnienie i obramowanie) - deprecated, używamy gradientu
  className?: string;
  label?: string;
  useGradient?: boolean; // Nowa prop do włączania gradientu
}

const StarRatingInput: React.FC<StarRatingInputProps> = ({
  value,
  onChange,
  count = 5,
  size = 'md',
  color = 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)', // Domyślnie użyje koloru tekstu (np. text-gray-400)
  activeColor = '#764ba2', // Fallback color z gradientu
  className = '',
  label,
  useGradient = true // Domyślnie używamy gradientu
}) => {
  // Mapowanie rozmiaru prop na rozmiar ikony Lucide (w pikselach)
  const iconSizeMap = {
    sm: 16, // w-4 h-4
    md: 20, // w-5 h-5
    lg: 24  // w-6 h-6
  };
  const iconPixelSize = iconSizeMap[size];

  // Unikalne ID dla defs w SVG (aby uniknąć konfliktów)
  const gradientId = `star-gradient-${Math.random().toString(36).substr(2, 9)}`;

  const handleStarClick = (rating: number) => {
    if (value === rating) {
      onChange(null); // Wyczyść filtr, jeśli kliknięto tę samą gwiazdkę
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
        aria-label={`${ratingValue} ${ratingValue === 1 ? 'gwiazdka' : 'gwiazdki'}`}
        title={value === ratingValue ? 'Kliknij aby wyczyścić filtr' : `Minimalna ocena: ${ratingValue}+`}
      >
        <div className="relative">
          <Star
            size={iconPixelSize}
            fill={isActive && useGradient ? `url(#${gradientId})` : isActive ? activeColor : 'none'}
            stroke={isActive && useGradient ? `url(#${gradientId})` : isActive ? activeColor : color}
            strokeWidth={1.5}
            className={`transition-all duration-150 ${
              isActive ? 'drop-shadow-sm' : ''
            }`}
          />
          {/* Gradient definition - tylko gdy useGradient jest true */}
          {useGradient && (
            <svg width="0" height="0" className="absolute">
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
            {/* Możesz dodać tekst tutaj jeśli potrzebny */}
          </span>
        )}
      </div>
    </div>
  );
};

export default StarRatingInput;