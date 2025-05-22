// frontend/src/components/features/auth/LoginForm.tsx
import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import * as authService from '@/services/authService';
import { LoginCredentials } from '@/types/authTypes';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import styles from './LoginForm.module.css';

const LoginForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginCredentials>();
  const auth = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<LoginCredentials> = async (data) => {
    setServerError(null);
    try {
      const { token, user } = await authService.loginUser(data);
      auth.login(token, user);
      navigate('/profile'); // Or to the last visited page
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Login failed. Please check your credentials.';
      setServerError(errorMessage);
      console.error('Login error:', error);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>Login</h2>
      {serverError && <p className={styles.serverError}>{serverError}</p>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.formGroup}>
          <label htmlFor="username">Username or Email</label>
          <Input
            id="username"
            type="text"
            {...register('username', { required: 'Username or email is required' })}
            aria-invalid={errors.username ? "true" : "false"}
          />
          {errors.username && <p className={styles.errorMessage} role="alert">{errors.username.message}</p>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password">Password</label>
          <Input
            id="password"
            type="password"
            {...register('password', { required: 'Password is required' })}
            aria-invalid={errors.password ? "true" : "false"}
          />
          {errors.password && <p className={styles.errorMessage} role="alert">{errors.password.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting} className={styles.submitButton}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;