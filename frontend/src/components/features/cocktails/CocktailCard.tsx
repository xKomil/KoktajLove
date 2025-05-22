// frontend/src/components/features/cocktails/CocktailCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { CocktailWithDetails, Tag } from '@/types/cocktailTypes';
import RatingStars from './RatingStars'; // Assuming you have this component
import Button from '@/components/ui/Button/Button';
import styles from './CocktailCard.module.css';

interface CocktailCardProps {
  cocktail: CocktailWithDetails; // Or a simpler CocktailListType
}

const CocktailCard: React.FC<CocktailCardProps> = ({ cocktail }) => {
  const placeholderImage = 'https://via.placeholder.com/300x200.png?text=No+Image';

  return (
    <div className={styles.card}>
      <img 
        src={cocktail.image_url || placeholderImage} 
        alt={cocktail.name} 
        className={styles.image} 
        onError={(e) => (e.currentTarget.src = placeholderImage)}
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
          {cocktail.tags.slice(0, 3).map((tag: Tag) => ( // Show max 3 tags
            <span key={tag.id} className={styles.tag}>{tag.name}</span>
          ))}
        </div>
      )}
      
      <Button 
        as={Link} 
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