// frontend/src/components/features/cocktails/CocktailCard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CocktailWithDetails, Tag } from '@/types/cocktailTypes';
import RatingStars from './RatingStars';
import Button from '@/components/ui/Button/Button';
import styles from './CocktailCard.module.css';

interface CocktailCardProps {
  cocktail: CocktailWithDetails;
}

const CocktailCard: React.FC<CocktailCardProps> = ({ cocktail }) => {
  const placeholderViaUrl = `https://pixabay.com/pl/photos/koktajl-kieliszek-koktajle-drink-1869860/`;
  // Opcjonalny lokalny placeholder, jeśli via.placeholder.com zawiedzie
  const localFallbackImageUrl = '/assets/default-cocktail.png'; // Umieść obrazek w public/assets

  const [currentSrc, setCurrentSrc] = useState(cocktail.image_url || placeholderViaUrl);
  // Flagi do śledzenia, które źródła już zawiodły
  const [originalImageFailed, setOriginalImageFailed] = useState(false);
  const [placeholderViaFailed, setPlaceholderViaFailed] = useState(false);

  const handleImageError = () => {
    if (!originalImageFailed && currentSrc === (cocktail.image_url || placeholderViaUrl) && cocktail.image_url) {
      // Pierwszy błąd: Oryginalny URL (cocktail.image_url) nie zadziałał
      console.warn(`Nie udało się załadować obrazka: ${cocktail.image_url}. Próbuję default-cocktail.`);
      setCurrentSrc(placeholderViaUrl);
      setOriginalImageFailed(true);
    } else if (!placeholderViaFailed && currentSrc === placeholderViaUrl) {
      // Drugi błąd: via.placeholder.com nie zadziałał
      console.warn(`Nie udało się załadować obrazka z default-cocktail. Próbuję lokalny fallback (jeśli istnieje).`);
      // Spróbuj lokalnego fallbacku, jeśli go zdefiniowałeś
      // Jeśli nie masz localFallbackImageUrl, możesz tu ustawić currentSrc na pusty string lub specjalny data URI
      setCurrentSrc(localFallbackImageUrl); // Ustaw na lokalny, jeśli go masz
      setPlaceholderViaFailed(true);
    } else if (currentSrc === localFallbackImageUrl) {
      // Trzeci błąd: Nawet lokalny fallback nie zadziałał. Nie rób nic więcej.
      console.error(`Nie udało się załadować nawet lokalnego fallbacku: ${localFallbackImageUrl}.`);
    }
  };

  // Efekt do resetowania stanu, gdy zmienia się koktajl
  useEffect(() => {
    setCurrentSrc(cocktail.image_url || placeholderViaUrl);
    setOriginalImageFailed(false);
    setPlaceholderViaFailed(false);
  }, [cocktail.id, cocktail.image_url, placeholderViaUrl]); // Dodaj cocktail.id, aby resetować przy zmianie koktajlu

  return (
    <div className={styles.card}>
      <img
        src={currentSrc}
        alt={cocktail.name}
        className={styles.image}
        onError={handleImageError}
      />
      <h3 className={styles.name}>{cocktail.name}</h3>
      <p className={styles.description}>
        {cocktail.description.length > 100
          ? `${cocktail.description.substring(0, 100)}...`
          : cocktail.description}
      </p>

      {cocktail.average_rating !== undefined && cocktail.average_rating !== null && (
        <div className={styles.rating}>
          <RatingStars rating={cocktail.average_rating} readOnly />
          ({cocktail.average_rating.toFixed(1)})
        </div>
      )}

      {cocktail.tags && cocktail.tags.length > 0 && (
        <div className={styles.tagsContainer}>
          {cocktail.tags.slice(0, 3).map((tag: Tag) => (
            <span key={tag.id} className={styles.tag}>{tag.name}</span>
          ))}
        </div>
      )}

      <Button
        as="link"
        to={`/cocktail/${cocktail.id}`}
        variant="secondary"
        className={styles.detailsLink}
      >
        View Details
      </Button>
    </div>
  );
};

export default CocktailCard;