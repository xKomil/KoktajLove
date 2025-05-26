// frontend/src/pages/EditCocktailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CocktailForm from '@/components/features/cocktails/CocktailForm';
import * as cocktailService from '@/services/cocktailService';
import { CocktailWithDetails } from '@/types';
import Spinner from '@/components/ui/Spinner/Spinner';
import { useAuth } from '@/hooks/useAuth';
import styles from './PageStyles.module.css';

const EditCocktailPage: React.FC = () => {
  const { cocktailId } = useParams<{ cocktailId: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [cocktail, setCocktail] = useState<CocktailWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cocktailId) {
      setError('Cocktail ID is missing.');
      setIsLoading(false);
      return;
    }
    if (authLoading) return; // Wait for auth state to resolve

    const fetchCocktail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await cocktailService.getCocktailById(cocktailId);
        
        // Authorization check: only owner can edit
        // Use author.id as the owner identifier (instead of user_id)
        if (!user || data.author?.id !== user.id) {
          setError('You are not authorized to edit this cocktail.');
          setCocktail(null); // Clear cocktail data
        } else {
          setCocktail(data);
        }
      } catch (err: any) {
        console.error('Failed to fetch cocktail for editing:', err);
        setError(err.response?.data?.detail || 'Failed to load cocktail data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCocktail();
  }, [cocktailId, user, authLoading, navigate]);

  const handleUpdateSuccess = (updatedCocktail: CocktailWithDetails) => {
    // Optionally show a success message
    navigate(`/cocktails/${updatedCocktail.id}`);
  };

  if (isLoading || authLoading) {
    return <div className={styles.pageContainer}><Spinner /><p>Loading cocktail for editing...</p></div>;
  }

  if (error) {
    return <div className={`${styles.pageContainer} ${styles.error}`}>{error}</div>;
  }

  if (!cocktail) {
    // This case might be hit if user is not authorized or cocktail not found after loading
    return <div className={styles.pageContainer}>Cocktail not available for editing.</div>;
  }

  return (
    <div className={styles.pageContainer}>
      {/* <h1 className={styles.pageTitle}>Edit "{cocktail.name}"</h1> */}
      <CocktailForm cocktail={cocktail} onSubmitSuccess={handleUpdateSuccess} />
    </div>
  );
};

export default EditCocktailPage;