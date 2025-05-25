// frontend/src/components/features/profile/ProfileDetails.tsx
import React, { useState } from 'react';
import { User } from '@/types/authTypes';
import styles from './ProfileDetails.module.css';
import Spinner from '@/components/ui/Spinner/Spinner';
// import Button from '@/components/ui/Button/Button'; // Uncomment when you have this component

interface ProfileDetailsProps {
  user: User | null;
  isLoading: boolean;
  error?: string | null;
  onEditClick?: () => void; // Optional callback for edit button
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({ 
  user, 
  isLoading, 
  error, 
  onEditClick 
}) => {
  const [imageError, setImageError] = useState(false);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  if (!user) {
    return <div className={styles.loading}>No user data available.</div>;
  }

  const defaultProfilePicUrl = 'https://www.mkm.szczecin.pl/images/default-avatar.svg?id=26d9452357b428b99ab97f2448b5d803';
  
  // Use avatar_url first, then fallback to profile_picture_url for backwards compatibility
  const userAvatarUrl = user.avatar_url || user.profile_picture_url;
  
  const imageUrlToDisplay = imageError || !userAvatarUrl 
    ? defaultProfilePicUrl 
    : userAvatarUrl;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!imageError && userAvatarUrl && e.currentTarget.src === userAvatarUrl) {
      console.warn(`Błąd ładowania obrazka profilowego: ${userAvatarUrl}. Używam domyślnego.`);
      setImageError(true);
    } else if (e.currentTarget.src === defaultProfilePicUrl) {
      console.error(`Nie można załadować nawet domyślnego obrazka: ${defaultProfilePicUrl}.`);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileHeader}>
        <img
          src={imageUrlToDisplay}
          alt={`${user.username}'s profile`}
          className={styles.profilePicture}
          onError={handleImageError}
        />
        <div className={styles.profileInfo}>
          <h2 className={styles.username}>{user.username}</h2>
          {user.bio && (
            <p className={styles.bio}>{user.bio}</p>
          )}
          {onEditClick && (
            <button 
              onClick={onEditClick}
              className={styles.editButton}
              type="button"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
      
      <dl className={styles.detailsGrid}>
        <dt>Email:</dt>
        <dd>{user.email}</dd>
        
        
        
        {user.is_superuser && (
          <>
            <dt>Role:</dt>
            <dd className={styles.roleAdmin}>Administrator</dd>
          </>
        )}
        
        <dt>Member Since:</dt>
        <dd>{formatDate(user.created_at)}</dd>
      </dl>
    </div>
  );
};

export default ProfileDetails;