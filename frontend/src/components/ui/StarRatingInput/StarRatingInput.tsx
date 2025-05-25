// frontend/src/components/ui/StarRatingInput/StarRatingInput.tsx
import React from 'react';
import { Star } from 'lucide-react'; // Import ikony Star z lucide-react

interface StarRatingInputProps {
  value: number | null;
  onChange: (rating: number | null) => void;
  count?: number;
  size?: 'sm' | 'md' | 'lg'; // Możemy mapować to na rozmiar ikony Lucide
  color?: string; // Kolor nieaktywnej gwiazdki (obramowanie)
  activeColor?: string; // Kolor aktywnej gwiazdki (wypełnienie i obramowanie)
  className?: string;
  label?: string;
}

const StarRatingInput: React.FC<StarRatingInputProps> = ({
  value,
  onChange,
  count = 5,
  size = 'md',
  color = 'currentColor', // Domyślnie użyje koloru tekstu (np. text-gray-400)
  activeColor = '#fbbf24', // Żółty dla aktywnych gwiazdek (np. text-yellow-400)
  className = '',
  label
}) => {
  // Mapowanie rozmiaru prop na rozmiar ikony Lucide (w pikselach)
  const iconSizeMap = {
    sm: 16, // w-4 h-4
    md: 20, // w-5 h-5
    lg: 24  // w-6 h-6
  };
  const iconPixelSize = iconSizeMap[size];

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
        className={`transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded p-0.5 /* Dodaj mały padding wokół przycisku, jeśli potrzebny dla focus ring */`}
        aria-label={`${ratingValue} ${ratingValue === 1 ? 'gwiazdka' : 'gwiazdki'}`}
        title={value === ratingValue ? 'Kliknij aby wyczyścić filtr' : `Minimalna ocena: ${ratingValue}+`}
      >
        <Star
          size={iconPixelSize}
          // Dla Lucide, kolor obramowania to `stroke`, a wypełnienia to `fill`
          // Jeśli gwiazdka jest aktywna, wypełniamy ją `activeColor`
          // Jeśli nieaktywna, wypełnienie może być 'none' lub kolor tła, a obramowanie `color`
          fill={isActive ? activeColor : 'none'}
          stroke={isActive ? activeColor : color}
          strokeWidth={1.5} // Możesz dostosować grubość linii
          className="transition-all duration-150 hover:scale-110" // Klasy Tailwind dla animacji
        />
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
          </span>
        )}
      </div>
    </div>
  );
};

export default StarRatingInput;