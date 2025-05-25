// frontend/src/components/features/profile/EditProfileForm.tsx
import React, { useState, useEffect } from 'react';
import { User, UserProfileUpdate } from '@/types/authTypes';
import { updateUserProfile } from '@/services/authService';
import { useAuth } from '@/hooks/useAuth';
import styles from './EditProfileForm.module.css';

interface EditProfileFormProps {
  user: User;
  onSuccess?: (updatedUser: User) => void;
  onCancel?: () => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({
  user,
  onSuccess,
  onCancel
}) => {
  const { updateUser } = useAuth();
  
  // Username jest teraz tylko do odczytu, zarządzane oddzielnie
  const [currentUsername, setCurrentUsername] = useState(user.username);
  
  const [formData, setFormData] = useState<Omit<UserProfileUpdate, 'username'>>({
    // username jest usunięte z edytowalnego stanu
    email: user.email,
    bio: user.bio || '',
    avatar_url: user.avatar_url || user.profile_picture_url || ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Reset form when user changes
  useEffect(() => {
    setCurrentUsername(user.username); // Aktualizuj wyświetlany username
    setFormData({ // Resetuj edytowalne pola
      email: user.email,
      bio: user.bio || '',
      avatar_url: user.avatar_url || user.profile_picture_url || ''
    });
    setErrors({});
    setSuccessMessage('');
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Walidacja dla username została usunięta
    // if (!formData.username?.trim()) {
    //   newErrors.username = 'Username is required';
    // } else if (formData.username.trim().length < 3) {
    //   newErrors.username = 'Username must be at least 3 characters long';
    // }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    if (formData.avatar_url && formData.avatar_url.trim()) {
      try {
        new URL(formData.avatar_url);
      } catch {
        newErrors.avatar_url = 'Please enter a valid URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage('');

    try {
      // Only send changed fields (username nie jest już częścią tego)
      const changedFields: Omit<UserProfileUpdate, 'username'> = {};
      
      // Nie sprawdzamy ani nie wysyłamy username
      // if (formData.username !== user.username) {
      //   changedFields.username = formData.username;
      // }
      if (formData.email !== user.email) {
        changedFields.email = formData.email;
      }
      if (formData.bio !== (user.bio || '')) {
        changedFields.bio = formData.bio || '';
      }
      if (formData.avatar_url !== (user.avatar_url || user.profile_picture_url || '')) {
        changedFields.avatar_url = formData.avatar_url || '';
      }

      // If no changes, show message and return
      if (Object.keys(changedFields).length === 0) {
        setSuccessMessage('No changes to save.');
        setIsSubmitting(false); // Odblokuj przyciski
        return;
      }

      // updateUserProfile oczekuje UserProfileUpdate, więc changedFields jest kompatybilne
      const updatedProfileData = await updateUserProfile(changedFields);
      
      // Stwórz pełny obiekt użytkownika do aktualizacji kontekstu i callbacku
      // Zakładamy, że updatedProfileData zawiera tylko zmienione pola (bez username)
      const fullUpdatedUser: User = {
        ...user, // Zachowaj ID, oryginalny username, itp.
        ...updatedProfileData, // Nadpisz zmienionymi danymi (email, bio, avatar_url)
      };
      
      // Update user in context
      updateUser(fullUpdatedUser);
      
      setSuccessMessage('Profile updated successfully!');
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(fullUpdatedUser);
      }

    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          setErrors({ general: error.response.data.detail });
        } else if (Array.isArray(error.response.data.detail)) {
          // Handle validation errors from FastAPI
          const validationErrors: Record<string, string> = {};
          error.response.data.detail.forEach((err: any) => {
            if (err.loc && err.loc.length > 1 && err.loc[0] === 'body') { // Upewnij się, że błąd pochodzi z ciała żądania
              validationErrors[err.loc[1]] = err.msg;
            }
          });
          setErrors(validationErrors);
        }
      } else {
        setErrors({ general: 'Failed to update profile. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h3 className={styles.formTitle}>Edit Profile</h3>

        {errors.general && (
          <div className={styles.errorMessage}>{errors.general}</div>
        )}

        {successMessage && (
          <div className={styles.successMessage}>{successMessage}</div>
        )}

        <div className={styles.fieldGroup}>
          <label htmlFor="username" className={styles.label}>
            Username {/* Usunięto '*', bo pole nie jest edytowalne */}
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={currentUsername || ''} // Używa currentUsername
            // onChange nie jest potrzebne dla pola disabled
            className={styles.input} // Nie ma potrzeby dodawania styles.inputError
            disabled // Pole jest zawsze zablokowane
            // required nie jest potrzebne dla pola disabled
          />
          {/* Walidacja i błędy dla username usunięte */}
          {/* {errors.username && (
            <span className={styles.fieldError}>{errors.username}</span>
          )} */}
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="email" className={styles.label}>
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email || ''}
            onChange={handleInputChange}
            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            disabled={isSubmitting} // Blokowane tylko podczas wysyłania
            required
          />
          {errors.email && (
            <span className={styles.fieldError}>{errors.email}</span>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="bio" className={styles.label}>
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio || ''}
            onChange={handleInputChange}
            className={`${styles.textarea} ${errors.bio ? styles.inputError : ''}`}
            disabled={isSubmitting}
            rows={4}
            maxLength={500}
            placeholder="Tell us about yourself..."
          />
          <div className={styles.charCount}>
            {formData.bio?.length || 0}/500
          </div>
          {errors.bio && (
            <span className={styles.fieldError}>{errors.bio}</span>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="avatar_url" className={styles.label}>
            Avatar URL
          </label>
          <input
            type="url"
            id="avatar_url"
            name="avatar_url"
            value={formData.avatar_url || ''}
            onChange={handleInputChange}
            className={`${styles.input} ${errors.avatar_url ? styles.inputError : ''}`}
            disabled={isSubmitting}
            placeholder="https://example.com/your-avatar.jpg"
          />
          {errors.avatar_url && (
            <span className={styles.fieldError}>{errors.avatar_url}</span>
          )}
        </div>

        <div className={styles.buttonGroup}>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${styles.button} ${styles.primaryButton}`}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className={`${styles.button} ${styles.secondaryButton}`}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default EditProfileForm;