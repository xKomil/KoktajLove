// frontend/src/components/features/profile/ChangePasswordForm.tsx
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { PasswordChangeData } from '@/types/authTypes';
import { changePassword } from '@/services/authService';
import styles from './ChangePasswordForm.module.css';

interface ChangePasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState<PasswordChangeData & { confirmPassword: string }>({
    current_password: '',
    new_password: '',
    confirmPassword: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.current_password) {
      newErrors.current_password = 'Current password is required';
    }

    if (!formData.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = 'New password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.new_password)) {
      newErrors.new_password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.new_password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.current_password === formData.new_password) {
      newErrors.new_password = 'New password must be different from current password';
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
      await changePassword({
        current_password: formData.current_password,
        new_password: formData.new_password
      });
      
      setSuccessMessage('Password changed successfully!');
      
      // Clear form
      setFormData({
        current_password: '',
        new_password: '',
        confirmPassword: ''
      });

      // Call success callback if provided
      if (onSuccess) {
        setTimeout(onSuccess, 1500); // Give user time to see success message
      }

    } catch (error: any) {
      console.error('Error changing password:', error);
      
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          if (error.response.data.detail.toLowerCase().includes('current password')) {
            setErrors({ current_password: 'Current password is incorrect' });
          } else {
            setErrors({ general: error.response.data.detail });
          }
        } else if (Array.isArray(error.response.data.detail)) {
          // Handle validation errors from FastAPI
          const validationErrors: Record<string, string> = {};
          error.response.data.detail.forEach((err: any) => {
            if (err.loc && err.loc.length > 1) {
              validationErrors[err.loc[1]] = err.msg;
            }
          });
          setErrors(validationErrors);
        }
      } else {
        setErrors({ general: 'Failed to change password. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h3 className={styles.formTitle}>Change Password</h3>

        {errors.general && (
          <div className={styles.errorMessage}>{errors.general}</div>
        )}

        {successMessage && (
          <div className={styles.successMessage}>{successMessage}</div>
        )}

        <div className={styles.fieldGroup}>
          <label htmlFor="current_password" className={styles.label}>
            Current Password *
          </label>
          <div className={styles.passwordField}>
            <input
              type={showPasswords.current ? 'text' : 'password'}
              id="current_password"
              name="current_password"
              value={formData.current_password}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.current_password ? styles.inputError : ''}`}
              disabled={isSubmitting}
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('current')}
              className={styles.passwordToggle}
              disabled={isSubmitting}
            >
              {showPasswords.current ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
          {errors.current_password && (
            <span className={styles.fieldError}>{errors.current_password}</span>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="new_password" className={styles.label}>
            New Password *
          </label>
          <div className={styles.passwordField}>
            <input
              type={showPasswords.new ? 'text' : 'password'}
              id="new_password"
              name="new_password"
              value={formData.new_password}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.new_password ? styles.inputError : ''}`}
              disabled={isSubmitting}
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              className={styles.passwordToggle}
              disabled={isSubmitting}
            >
              {showPasswords.new ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
          {errors.new_password && (
            <span className={styles.fieldError}>{errors.new_password}</span>
          )}
          <div className={styles.passwordHint}>
            Password must be at least 8 characters with uppercase, lowercase, and number.
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="confirmPassword" className={styles.label}>
            Confirm New Password *
          </label>
          <div className={styles.passwordField}>
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
              disabled={isSubmitting}
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirm')}
              className={styles.passwordToggle}
              disabled={isSubmitting}
            >
              {showPasswords.confirm ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <span className={styles.fieldError}>{errors.confirmPassword}</span>
          )}
        </div>

        <div className={styles.buttonGroup}>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${styles.button} ${styles.primaryButton}`}
          >
            {isSubmitting ? 'Changing...' : 'Change Password'}
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

export default ChangePasswordForm;