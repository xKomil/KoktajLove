// frontend/src/pages/NotFoundPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import pageStyles from './PageStyles.module.css';
import notFoundStyles from './NotFoundPage.module.css';

const NotFoundPage: React.FC = () => {
  return (
    <div className={`${pageStyles.pageContainer} ${notFoundStyles.notFoundContainer}`}>

      <h1 className={notFoundStyles.title}>404 - Page Not Found</h1>
      <p className={notFoundStyles.message}>
        Oops! The page you are looking for does not exist.
      </p>
      <p className={notFoundStyles.linkMessage}>
        You can <Link to="/" className={notFoundStyles.homeLink}>return to the homepage</Link>.
      </p>
    </div>
  );
};

export default NotFoundPage;