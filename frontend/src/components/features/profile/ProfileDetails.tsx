// frontend/src/components/features/profile/ProfileDetails.tsx
import React, { useState } from 'react'; // Dodaj useState
import { User } from '@/types/authTypes';
import styles from './ProfileDetails.module.css';
import Spinner from '@/components/ui/Spinner/Spinner';

interface ProfileDetailsProps {
  user: User | null;
  isLoading: boolean;
  error?: string | null;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({ user, isLoading, error }) => {
  // Stan do śledzenia, czy wystąpił błąd ładowania oryginalnego obrazka
  const [imageError, setImageError] = useState(false);

  if (isLoading) {
    return <div className={styles.loading}><Spinner /> <p>Loading profile...</p></div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  if (!user) {
    return <div className={styles.loading}>No user data available.</div>;
  }

  const defaultProfilePicUrl = 'https://www.mkm.szczecin.pl/images/default-avatar.svg?id=26d9452357b428b99ab97f2448b5d803';
  // Możesz też przygotować lokalny obrazek zastępczy
  // const localFallbackImageUrl = '/assets/default-avatar.png'; // Upewnij się, że ścieżka jest poprawna i plik istnieje w public/assets

  // Wybierz URL obrazka: jeśli jest błąd z user.profile_picture_url, użyj defaultProfilePicUrl
  // Jeśli nie ma user.profile_picture_url, również użyj defaultProfilePicUrl
  const imageUrlToDisplay = 
    imageError || !user.profile_picture_url 
      ? defaultProfilePicUrl 
      : user.profile_picture_url;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Jeśli oryginalny obrazek (user.profile_picture_url) nie załadował się, ustaw flagę błędu.
    // To spowoduje, że imageUrlToDisplay przełączy się na defaultProfilePicUrl.
    if (!imageError && e.currentTarget.src === user.profile_picture_url) {
      console.warn(`Błąd ładowania obrazka profilowego: ${user.profile_picture_url}. Używam domyślnego.`);
      setImageError(true);
    } else if (e.currentTarget.src === defaultProfilePicUrl) {
      // Jeśli nawet domyślny obrazek (defaultProfilePicUrl) nie załadował się,
      // aby uniknąć pętli, nie rób nic więcej lub ustaw jakiś bardzo prosty placeholder.
      // Możesz też np. ukryć <img> lub pokazać inicjały.
      console.error(`Nie można załadować nawet domyślnego obrazka: ${defaultProfilePicUrl}.`);
      // Opcjonalnie: e.currentTarget.style.display = 'none'; // Ukryj obrazek, jeśli oba zawiodą
      // Lub ustaw jakiś inny, bardzo prosty fallback, np. z data URI lub lokalny
      // e.currentTarget.src = localFallbackImageUrl; // Jeśli masz lokalny
    }
  };

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileHeader}>
        <img
          src={imageUrlToDisplay}
          alt={`${user.username}'s profile`}
          className={styles.profilePicture}
          onError={handleImageError} // Użyj nowej funkcji obsługi błędu
        />
        <h2 className={styles.username}>{user.username}</h2>
      </div>
      <dl className={styles.detailsGrid}>
        <dt>Email:</dt>
        <dd>{user.email}</dd>
        <dt>User ID:</dt>
        <dd>{user.id}</dd>
        <dt>Active:</dt>
        <dd>{user.is_active ? 'Yes' : 'No'}</dd>
        {user.is_superuser && (
          <>
            <dt>Role:</dt>
            <dd>Administrator</dd>
          </>
        )}
      </dl>
    </div>
  );
};

export default ProfileDetails;