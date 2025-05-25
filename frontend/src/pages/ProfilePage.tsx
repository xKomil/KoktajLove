// frontend/src/pages/ProfilePage.tsx
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import ProfileDetails from '@/components/features/profile/ProfileDetails';
import EditProfileForm from '@/components/features/profile/EditProfileForm';
import ChangePasswordForm from '@/components/features/profile/ChangePasswordForm';
import UserCocktailList from '@/components/features/profile/UserCocktailList';
import { User } from '@/types/authTypes';
import styles from './PageStyles.module.css';

type ProfileView = 'details' | 'edit' | 'changePassword';

const ProfilePage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ProfileView>('details');

  // ProtectedRoute should handle unauthenticated users,
  // but this is an additional safeguard.
  if (authLoading) {
    return (
      <div className={styles.pageContainer}>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    // This should ideally not be reached if ProtectedRoute is working correctly.
    return (
      <div className={styles.pageContainer}>
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  const handleEditSuccess = (updatedUser: User) => {
    setCurrentView('details');
  };

  const handleEditCancel = () => {
    setCurrentView('details');
  };

  const handlePasswordChangeSuccess = () => {
    setCurrentView('details');
  };

  const handlePasswordChangeCancel = () => {
    setCurrentView('details');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'edit':
        return (
          <EditProfileForm
            user={user}
            onSuccess={handleEditSuccess}
            onCancel={handleEditCancel}
          />
        );
      
      case 'changePassword':
        return (
          <ChangePasswordForm
            onSuccess={handlePasswordChangeSuccess}
            onCancel={handlePasswordChangeCancel}
          />
        );
      
      default:
        return (
          <>
            <ProfileDetails 
              user={user} 
              isLoading={authLoading}
              onEditClick={() => setCurrentView('edit')}
            />
            
            <div className={styles.profileActions}>
              <button
                onClick={() => setCurrentView('edit')}
                className={`${styles.actionButton} ${styles.editButton}`}
              >
                Edit Profile
              </button>
              
              <button
                onClick={() => setCurrentView('changePassword')}
                className={`${styles.actionButton} ${styles.passwordButton}`}
              >
                Change Password
              </button>
            </div>

            <UserCocktailList userId={user.id} />
          </>
        );
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.profileHeader}>
        <h1 className={styles.pageTitle}>My Profile</h1>
        
        {currentView !== 'details' && (
          <button
            onClick={() => setCurrentView('details')}
            className={`${styles.backButton}`}
          >
            ← Back to Profile
          </button>
        )}
      </div>

      {renderContent()}
    </div>
  );
};

export default ProfilePage;