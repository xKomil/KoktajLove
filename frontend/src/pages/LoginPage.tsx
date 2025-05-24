// frontend/src/pages/LoginPage.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import LoginForm from '@/components/features/auth/LoginForm';
import styles from './PageStyles.module.css'; // Optional: create a shared page style

const LoginPage: React.FC = () => {
  const location = useLocation();
  const message = location.state?.message;

  return (
    <div className={styles.pageContainer}>
      {/* <h1 className={styles.pageTitle}>Login</h1> */}
      {message && <p className={styles.successMessage}>{message}</p>}
      <LoginForm />
    </div>
  );
};

export default LoginPage;