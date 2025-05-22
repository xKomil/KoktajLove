// frontend/src/components/features/auth/RegisterForm.tsx
import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import * as authService from '@/services/authService';
import { RegisterData } from '@/types/authTypes';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import styles from './RegisterForm.module.css';

const RegisterForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<RegisterData>();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const password = watch('password');

  const onSubmit: SubmitHandler<RegisterData> = async (data) => {
    setServerError(null);
    // Omit confirmPassword before sending to backend if it exists in the form data
    const { confirmPassword, ...registrationData } = data as RegisterData & { confirmPassword?: string };
    
    try {
      await authService.registerUser(registrationData);
      // Optionally: log the user in directly or show a success message
      // For now, navigate to login page
      navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Registration failed. Please try again.';
      setServerError(errorMessage);
      console.error('Registration error:', error);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>Register</h2>
      {serverError && <p className={styles.serverError}>{serverError}</p>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.formGroup}>
          <label htmlFor="username">Username</label>
          <Input
            id="username"
            type="text"
            {...register('username', { 
              required: 'Username is required',
              minLength: { value: 3, message: 'Username must be at least 3 characters' } 
            })}
            aria-invalid={errors.username ? "true" : "false"}
          />
          {errors.username && <p className={styles.errorMessage} role="alert">{errors.username.message}</p>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email">Email</label>
          <Input
            id="email"
            type="email"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            aria-invalid={errors.email ? "true" : "false"}
          />
          {errors.email && <p className={styles.errorMessage} role="alert">{errors.email.message}</p>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password">Password</label>
          <Input
            id="password"
            type="password"
            {...register('password', { 
              required: 'Password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters' }
            })}
            aria-invalid={errors.password ? "true" : "false"}
          />
          {errors.password && <p className={styles.errorMessage} role="alert">{errors.password.message}</p>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword">Confirm Password</label>
          <Input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword' as any, { // Using 'any' here because confirmPassword is not in RegisterData
              required: 'Please confirm your password',
              validate: value => value === password || 'Passwords do not match'
            })}
            aria-invalid={errors.confirmPassword ? "true" : "false"}
          />
          {errors.confirmPassword && <p className={styles.errorMessage} role="alert">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting} className={styles.submitButton}>
          {isSubmitting ? 'Registering...' : 'Register'}
        </Button>
      </form>
    </div>
  );
};

export default RegisterForm;