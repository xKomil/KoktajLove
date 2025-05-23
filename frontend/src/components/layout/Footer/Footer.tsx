// frontend/src/components/layout/Footer/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.container}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>KoktajLOVE</h2>
          <p>Discover and share your favorite cocktail recipes with cocktail enthusiasts from around the world.</p>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Quick Links</h3>
          <ul className={styles.linkList}>
            <li><Link to="/" className={styles.link}>Home</Link></li>
            <li><Link to="/cocktails" className={styles.link}>All Cocktails</Link></li>
            <li><Link to="/add-cocktail" className={styles.link}>Add Recipe</Link></li>
            <li><Link to="/my-favorites" className={styles.link}>My Favorites</Link></li>
          </ul>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Help & Info</h3>
          <ul className={styles.linkList}>
            <li><Link to="/about" className={styles.link}>About Us</Link></li>
            <li><Link to="/contact" className={styles.link}>Contact</Link></li>
            <li><Link to="/privacy" className={styles.link}>Privacy Policy</Link></li>
            <li><Link to="/terms" className={styles.link}>Terms of Service</Link></li>
          </ul>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Connect</h3>
          <div className={styles.socialLinks}>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="Follow us on Facebook"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z"/>
              </svg>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="Follow us on Twitter"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
              </svg>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="Follow us on Instagram"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01"/>
              </svg>
            </a>
          </div>
        </div>

        <div className={styles.copyright}>
          <p>&copy; {currentYear} KoktajLOVE. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;