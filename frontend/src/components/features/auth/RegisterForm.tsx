// frontend/src/components/features/auth/RegisterForm.tsx
import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import * as authService from '@/services/authService';
import { RegisterData } from '@/types/authTypes';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import styles from './RegisterForm.module.css';

interface ExtendedRegisterData extends RegisterData {
  confirmPassword: string;
}

const RegisterForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<ExtendedRegisterData>();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const password = watch('password');

  // Funkcja do oceny siły hasła
  const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    if (!password) return 'weak';
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score < 3) return 'weak';
    if (score < 5) return 'medium';
    return 'strong';
  };

  const getPasswordStrengthText = (strength: 'weak' | 'medium' | 'strong'): string => {
    switch (strength) {
      case 'weak': return 'Weak password - add uppercase, numbers and special characters';
      case 'medium': return 'Medium password - consider adding more variety';
      case 'strong': return 'Strong password!';
    }
  };

  const onSubmit: SubmitHandler<ExtendedRegisterData> = async (data) => {
    setServerError(null);
    
    // Usuń confirmPassword przed wysłaniem do backendu
    const { confirmPassword, ...registrationData } = data;
    
    try {
      await authService.registerUser(registrationData);
      
      // Przekieruj do logowania z komunikatem o sukcesie
      navigate('/login', { 
        state: { 
          message: 'Registration successful! Please sign in with your new account.' 
        } 
      });
    } catch (error: any) {
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Obsługa błędów walidacji z backendu
        const errors = error.response.data.errors;
        errorMessage = Object.values(errors).flat().join(', ');
      }
      
      setServerError(errorMessage);
      console.error('Registration error:', error);
    }
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;

  return (
    <div className={styles.form}>
      <h2 className={styles.formTitle}>Create Account</h2>
      
      {serverError && (
        <div className={styles.serverError} role="alert">
          {serverError}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.formSections}>
          <div>
            <div className={styles.sectionTitle}>Account Information</div>
            
            <div className={styles.formGroup}>
              <Input
                id="username"
                type="text"
                label="Username"
                placeholder="Choose a unique username"
                {...register('username', { 
                  required: 'Username is required',
                  minLength: { 
                    value: 3, 
                    message: 'Username must be at least 3 characters' 
                  },
                  maxLength: { 
                    value: 20, 
                    message: 'Username cannot exceed 20 characters' 
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_-]+$/,
                    message: 'Username can only contain letters, numbers, underscores and hyphens'
                  }
                })}
                error={errors.username?.message}
                aria-invalid={errors.username ? "true" : "false"}
              />
            </div>

            <div className={styles.formGroup}>
              <Input
                id="email"
                type="email"
                label="Email Address"
                placeholder="Enter your email address"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Please enter a valid email address'
                  }
                })}
                error={errors.email?.message}
                aria-invalid={errors.email ? "true" : "false"}
              />
            </div>
          </div>

          <div>
            <div className={styles.sectionTitle}>Security</div>
            
            <div className={styles.formGroup}>
              <Input
                id="password"
                type="password"
                label="Password"
                placeholder="Create a strong password"
                showPasswordToggle
                {...register('password', { 
                  required: 'Password is required',
                  minLength: { 
                    value: 6, 
                    message: 'Password must be at least 6 characters' 
                  }
                })}
                error={errors.password?.message}
                aria-invalid={errors.password ? "true" : "false"}
              />
              
              {password && passwordStrength && (
                <div className={`${styles.passwordStrength} ${styles[passwordStrength]}`}>
                  {getPasswordStrengthText(passwordStrength)}
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <Input
                id="confirmPassword"
                type="password"
                label="Confirm Password"
                placeholder="Repeat your password"
                showPasswordToggle
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                error={errors.confirmPassword?.message}
                aria-invalid={errors.confirmPassword ? "true" : "false"}
              />
            </div>
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting} 
          isLoading={isSubmitting}
          className={styles.submitButton}
          fullWidth
        >
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      <div className={styles.helpLinks}>
        Already have an account?{' '}
        <Link to="/login" className={styles.helpLink}>
          Sign in here
        </Link>
      </div>
    </div>
  );
};

export default RegisterForm;