// frontend/src/pages/CocktailDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as cocktailService from '@/services/cocktailService';
import { CocktailWithDetails, Rating } from '@/types';
import Spinner from '@/components/ui/Spinner/Spinner';
import Button from '@/components/ui/Button/Button';
import RatingStars from '@/components/features/cocktails/RatingStars';
import { useAuth } from '@/hooks/useAuth';
import * as ratingService from '@/services/ratingService';
import * as favoriteService from '@/services/favoriteService';
import styles from './PageStyles.module.css'; // General page styles
import detailStyles from './CocktailDetailPage.module.css'; // Specific styles

const CocktailDetailPage: React.FC = () => {
  const { cocktailId } = useParams<{ cocktailId: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [cocktail, setCocktail] = useState<CocktailWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  const [isFavoriteSubmitting, setIsFavoriteSubmitting] = useState(false);

  const fetchCocktailDetails = React.useCallback(async () => {
    if (!cocktailId) {
      setError('Cocktail ID is missing.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await cocktailService.getCocktailById(cocktailId);
      setCocktail(data);
      // If user is authenticated, fetch their rating for this cocktail
      if (isAuthenticated && user) {
        try {
          const ratingData = await ratingService.getUserRatingForCocktail(user.id, data.id);
          setUserRating(ratingData ? ratingData.score : null);
        } catch (ratingError: any) {
          // It's okay if user hasn't rated yet (404), don't show as page error
          if (ratingError.response?.status !== 404) {
            console.warn('Could not fetch user rating:', ratingError);
          }
        }
        try {
            const favStatus = await favoriteService.isCocktailFavorite(data.id);
            setIsFavorite(favStatus.is_favorite);
        } catch (favError) {
            console.warn('Could not fetch favorite status:', favError);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch cocktail details:', err);
      setError(err.response?.data?.detail || 'Failed to load cocktail details.');
    } finally {
      setIsLoading(false);
    }
  }, [cocktailId, isAuthenticated, user]);

  useEffect(() => {
    fetchCocktailDetails();
  }, [fetchCocktailDetails]);

  const handleRatingSubmit = async (newRating: number) => {
    if (!cocktail || !isAuthenticated || !user) return;
    setIsRatingSubmitting(true);
    try {
      await ratingService.rateCocktail(cocktail.id, newRating);
      setUserRating(newRating);
      // Optionally, re-fetch cocktail to update average_rating
      fetchCocktailDetails(); 
    } catch (err) {
      console.error('Failed to submit rating:', err);
      // Handle error display to user
    } finally {
      setIsRatingSubmitting(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!cocktail || !isAuthenticated) return;
    setIsFavoriteSubmitting(true);
    try {
      if (isFavorite) {
        await favoriteService.removeCocktailFromFavorites(cocktail.id);
        setIsFavorite(false);
      } else {
        await favoriteService.addCocktailToFavorites(cocktail.id);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Failed to update favorite status:', err);
    } finally {
      setIsFavoriteSubmitting(false);
    }
  };
  
  const handleDeleteCocktail = async () => {
    if (!cocktail || !window.confirm(`Are you sure you want to delete "${cocktail.name}"?`)) {
      return;
    }
    try {
      await cocktailService.deleteCocktail(cocktail.id);
      navigate('/'); // Or to a list page
    } catch (err) {
      console.error('Failed to delete cocktail:', err);
      setError('Could not delete cocktail.');
    }
  };


  if (isLoading) {
    return <div className={styles.pageContainer}><Spinner /> <p>Loading cocktail...</p></div>;
  }

  if (error) {
    return <div className={`${styles.pageContainer} ${styles.error}`}>{error}</div>;
  }

  if (!cocktail) {
    return <div className={styles.pageContainer}>Cocktail not found.</div>;
  }
  
  const isOwner = isAuthenticated && user && user.id === cocktail.owner_id;
  const placeholderImage = 'https://via.placeholder.com/600x400.png?text=Cocktail';

  return (
    <div className={`${styles.pageContainer} ${detailStyles.cocktailDetailContainer}`}>
      <div className={detailStyles.header}>
        <h1 className={detailStyles.name}>{cocktail.name}</h1>
        {isOwner && (
            <div className={detailStyles.ownerActions}>
                <Button as="link" to={`/edit-cocktail/${cocktail.id}`} variant="secondary" size="small">
                    Edit
                </Button>
                <Button onClick={handleDeleteCocktail} variant="danger" size="small" disabled={isLoading}>
                    Delete
                </Button>
            </div>
        )}
      </div>

      <div className={detailStyles.mainContent}>
        <div className={detailStyles.imageContainer}>
            <img 
                src={cocktail.image_url || placeholderImage} 
                alt={cocktail.name} 
                className={detailStyles.image}
                onError={(e) => (e.currentTarget.src = placeholderImage)}
            />
        </div>
        <div className={detailStyles.info}>
            <p className={detailStyles.description}>{cocktail.description}</p>

            <div className={detailStyles.ratingSection}>
                <h4>Average Rating:</h4>
                {cocktail.average_rating !== null && cocktail.average_rating !== undefined ? (
                    <>
                        <RatingStars rating={cocktail.average_rating} readOnly />
                        <span> ({cocktail.average_rating.toFixed(1)} / 5)</span>
                    </>
                ) : (
                    <p>Not rated yet.</p>
                )}
            </div>

            {isAuthenticated && (
            <div className={detailStyles.userInteractionSection}>
                <div className={detailStyles.userRatingSection}>
                    <h4>Your Rating:</h4>
                    <RatingStars
                        rating={userRating || 0}
                        onRatingChange={handleRatingSubmit}
                        readOnly={isRatingSubmitting}
                    />
                    {isRatingSubmitting && <Spinner size={20} />}
                </div>
                <Button
                    onClick={handleToggleFavorite}
                    disabled={isFavoriteSubmitting}
                    variant={isFavorite ? "secondary" : "primary"}
                    className={detailStyles.favoriteButton}
                >
                    {isFavoriteSubmitting ? <Spinner size={18}/> : (isFavorite ? 'Unfavorite' : 'Favorite')}
                </Button>
            </div>
            )}


            <h4>Ingredients:</h4>
            <ul className={detailStyles.ingredientList}>
            {cocktail.ingredients.map(item => (
                <li key={item.ingredient.id}>
                {item.ingredient.name}: {item.quantity} {item.unit}
                </li>
            ))}
            </ul>

            <h4>Instructions:</h4>
            <p className={detailStyles.instructions}>{cocktail.instructions}</p>

            {cocktail.tags && cocktail.tags.length > 0 && (
            <>
                <h4>Tags:</h4>
                <div className={detailStyles.tagList}>
                {cocktail.tags.map(tag => (
                    <span key={tag.id} className={detailStyles.tag}>{tag.name}</span>
                ))}
                </div>
            </>
            )}
            <p className={detailStyles.metaInfo}>
                Added by: User ID {cocktail.owner_id} | 
                Last updated: {new Date(cocktail.updated_at).toLocaleDateString()}
            </p>
        </div>
      </div>
      <Link to="/" className={styles.backLink}>Back to list</Link>
    </div>
  );
};

// Add CocktailDetailPage.module.css
// /* frontend/src/pages/CocktailDetailPage.module.css */
// .cocktailDetailContainer { /* Styles for overall container */ }
// .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
// .name { font-size: 2.5rem; color: #333; }
// .ownerActions button { margin-left: 0.5rem; }
// .mainContent { display: grid; grid-template-columns: 1fr; gap: 2rem; }
// @media (min-width: 768px) { .mainContent { grid-template-columns: 300px 1fr; } }
// .imageContainer {}
// .image { width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
// .info {}
// .description { font-size: 1.1rem; color: #555; margin-bottom: 1rem; }
// .ratingSection, .userInteractionSection, .userRatingSection { margin-bottom: 1rem; }
// .userInteractionSection { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; }
// .favoriteButton {}
// .ingredientList { list-style: disc; padding-left: 20px; margin-bottom: 1rem; }
// .instructions { white-space: pre-wrap; /* Preserve formatting */ margin-bottom: 1rem; }
// .tagList { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
// .tag { background-color: #e9ecef; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.9rem; }
// .metaInfo { font-size: 0.85rem; color: #777; margin-top: 1.5rem; }

export default CocktailDetailPage;