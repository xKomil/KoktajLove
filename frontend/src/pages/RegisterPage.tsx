// frontend/src/pages/RegisterPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import RegisterForm from '@/components/features/auth/RegisterForm';
import styles from './PageStyles.module.css'; // Optional: create a shared page style

const RegisterPage: React.FC = () => {
  return (
    <div className={styles.pageContainer}>
      {/* <h1 className={styles.pageTitle}>Create Account</h1> */}
      <RegisterForm />
      <p className={styles.authRedirectText}>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
};

export default RegisterPage;