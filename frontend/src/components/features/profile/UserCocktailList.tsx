// frontend/src/components/features/profile/UserCocktailList.tsx
import React, { useEffect, useState } from 'react';
import { CocktailWithDetails } from '@/types/cocktailTypes';
import * as cocktailService from '@/services/cocktailService'; // Assuming a method to get user's cocktails
import * as userService from '@/services/userService'; // Or directly from userService
import CocktailCard from '@/components/features/cocktails/CocktailCard';
import Spinner from '@/components/ui/Spinner/Spinner';
import styles from './UserCocktailList.module.css';

interface UserCocktailListProps {
  userId: number | string; // Or User object if you prefer
}

const UserCocktailList: React.FC<UserCocktailListProps> = ({ userId }) => {
  const [cocktails, setCocktails] = useState<CocktailWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserCocktails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Assuming a service function like this exists.
        // It might need adjustments based on your actual API endpoint for user's cocktails.
        // e.g., userService.getUserCocktails(userId) or cocktailService.getCocktails({ owner_id: userId })
        const userCocktails = await userService.getUserCocktails(userId); 
        setCocktails(userCocktails);
      } catch (err: any) {
        console.error('Failed to fetch user cocktails:', err);
        setError(err.message || 'Could not load your cocktails.');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserCocktails();
    }
  }, [userId]);

  if (isLoading) {
    return <div className={styles.loading}><Spinner /><p>Loading your cocktails...</p></div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>My Cocktails</h3>
      {cocktails.length === 0 ? (
        <p className={styles.noCocktails}>You haven't added any cocktails yet.</p>
      ) : (
        <div className={styles.list}>
          {cocktails.map(cocktail => (
            <CocktailCard key={cocktail.id} cocktail={cocktail} />
          ))}
        </div>
      )}
    </div>
  );
};

export default UserCocktailList;