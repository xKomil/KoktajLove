// Navbar.tsx - Kolejna modyfikacja
import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import styles from './Navbar.module.css';

const Navbar: React.FC = () => {
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isMobileMenuOpen]);

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.navLink} ${isActive ? styles.active : ''}`;

  return (
    <nav className={styles.navbar} role="navigation" aria-label="Main navigation">
      <Link to={isAuthenticated ? "/cocktails" : "/"} className={styles.logo} aria-label="KoktajLOVE">
        <span className={styles.logoText}>KoktajLOVE</span>
        <span className={styles.logoIcon}>🍹</span>
      </Link>

      <button
        className={styles.mobileMenuButton}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-expanded={isMobileMenuOpen}
        aria-controls="mobile-menu"
        aria-label="Toggle navigation menu"
      >
        <span className={styles.hamburger}></span>
        <span className={styles.hamburger}></span>
        <span className={styles.hamburger}></span>
      </button>

      <div
        className={`${styles.navLinks} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}
        id="mobile-menu"
      >
        {!isLoading && !isAuthenticated && (
          <NavLink to="/" className={getNavLinkClass} onClick={closeMobileMenu} end>
            Home
          </NavLink>
        )}

        {/* === POCZĄTEK ZMIANY === */}
        {/* Link "Cocktails" jest teraz częścią bloku dla zalogowanych użytkowników */}
        {!isLoading && isAuthenticated && (
          <>
            {/* Dodajemy link "Cocktails" tutaj */}
            <NavLink to="/cocktails" className={getNavLinkClass} onClick={closeMobileMenu}>
              Cocktails
            </NavLink>
            <NavLink to="/add-cocktail" className={getNavLinkClass} onClick={closeMobileMenu}>
              Add Cocktail
            </NavLink>
            <NavLink to="/my-favorites" className={getNavLinkClass} onClick={closeMobileMenu}>
              My Favorites
            </NavLink>
            <NavLink to="/profile" className={getNavLinkClass} onClick={closeMobileMenu}>
              {user?.username || 'Profile'}
            </NavLink>
            <button
              onClick={handleLogout}
              className={`${styles.navLink} ${styles.logoutButton}`}
              aria-label="Logout from account"
            >
              Logout
            </button>
          </>
        )}
        {/* === KONIEC ZMIANY === */}

        {!isLoading && !isAuthenticated && (
          <>
            <NavLink to="/login" className={getNavLinkClass} onClick={closeMobileMenu}>
              Login
            </NavLink>
            <NavLink to="/register" className={getNavLinkClass} onClick={closeMobileMenu}>
              Register
            </NavLink>
          </>
        )}
      </div>

      {isMobileMenuOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
    </nav>
  );
};

export default Navbar;