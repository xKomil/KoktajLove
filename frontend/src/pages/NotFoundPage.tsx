// frontend/src/pages/NotFoundPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PageStyles.module.css'; // Optional: create a shared page style

const NotFoundPage: React.FC = () => {
  return (
    <div className={`${styles.pageContainer} ${styles.centeredMessage}`}>
      <h1 className={styles.pageTitle}>404 - Page Not Found</h1>
      <p>Oops! The page you are looking for does not exist.</p>
      <p>
        You can <Link to="/" className={styles.styledLink}>return to the homepage</Link>.
      </p>
    </div>
  );
};

export default NotFoundPage;