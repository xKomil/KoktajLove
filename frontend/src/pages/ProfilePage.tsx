// frontend/src/pages/ProfilePage.tsx
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import ProfileDetails from '@/components/features/profile/ProfileDetails';
import UserCocktailList from '@/components/features/profile/UserCocktailList';
// import Button from '@/components/ui/Button/Button'; // For Edit Profile button
import styles from './PageStyles.module.css'; // Optional: create a shared page style

const ProfilePage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();

  // ProtectedRoute should handle unauthenticated users,
  // but this is an additional safeguard.
  if (authLoading) {
    return <div className={styles.pageContainer}><p>Loading profile...</p></div>;
  }

  if (!user) {
    // This should ideally not be reached if ProtectedRoute is working correctly.
    return <div className={styles.pageContainer}><p>Please log in to view your profile.</p></div>;
  }

  return (
    <div className={styles.pageContainer}>
      {/* <h1 className={styles.pageTitle}>My Profile</h1> */}
      <ProfileDetails user={user} isLoading={authLoading} />
      
      {/* Future: Edit Profile Button */}
      {/* <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <Button as="link" to="/profile/edit" variant="secondary">
          Edit Profile
        </Button>
      </div> */}

      <UserCocktailList userId={user.id} />
    </div>
  );
};

export default ProfilePage;