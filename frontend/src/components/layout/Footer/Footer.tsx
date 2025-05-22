// frontend/src/components/layout/Footer/Footer.tsx
import React from 'react';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p>&copy; {currentYear} KoktajLOVE. All rights reserved.</p>
        {/* You can add more links or information here */}
      </div>
    </footer>
  );
};

export default Footer;