// frontend/src/components/features/auth/LoginForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import * as authService from '@/services/authService';
import { LoginCredentials } from '@/types/authTypes';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import styles from './LoginForm.module.css';

interface LocationState {
  message?: string;
}

const LoginForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginCredentials>();
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sprawdź czy jest komunikat z rejestracji
  useEffect(() => {
    const state = location.state as LocationState;
    if (state?.message) {
      setSuccessMessage(state.message);
      // Wyczyść state po wyświetleniu komunikatu
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const onSubmit: SubmitHandler<LoginCredentials> = async (data) => {
    setServerError(null);
    setSuccessMessage(null);
    
    try {
      const { token, user } = await authService.loginUser(data);
      auth.login(token, user);
      
      // Przekieruj do profilu lub ostatniej odwiedzonej strony
      const from = (location.state as any)?.from?.pathname || '/profile';
      navigate(from, { replace: true });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
        error.response?.data?.message || 
        'Login failed. Please check your credentials.';
      setServerError(errorMessage);
      console.error('Login error:', error);
    }
  };

  return (
    <div className={styles.form}>
      <h2 className={styles.formTitle}>Sign In</h2>
      
      {successMessage && (
        <div className={styles.successMessage} role="alert">
          {successMessage}
        </div>
      )}
      
      {serverError && (
        <div className={styles.serverError} role="alert">
          {serverError}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.formGroup}>
          <Input
            id="username"
            type="text"
            label="Username or Email"
            placeholder="Enter your username or email"
            {...register('username', { 
              required: 'Username or email is required',
              minLength: { 
                value: 2, 
                message: 'Username must be at least 2 characters' 
              }
            })}
            error={errors.username?.message}
            aria-invalid={errors.username ? "true" : "false"}
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="Enter your password"
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
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting} 
          isLoading={isSubmitting}
          className={styles.submitButton}
          fullWidth
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className={styles.helpLinks}>
        Don't have an account?{' '}
        <Link to="/register" className={styles.helpLink}>
          Create one here
        </Link>
      </div>
    </div>
  );
};

export default LoginForm;