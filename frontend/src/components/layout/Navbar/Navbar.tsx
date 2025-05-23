// Navbar.tsx - Znacznie ulepszona wersja
import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import styles from './Navbar.module.css';

const Navbar: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Close mobile menu on escape key
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
      <Link to="/" className={styles.logo} aria-label="KoktajLOVE - Home">
        <span className={styles.logoText}>KoktajLOVE</span>
        <span className={styles.logoIcon}>🍹</span>
      </Link>

      {/* Mobile menu button */}
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

      {/* Navigation links */}
      <div 
        className={`${styles.navLinks} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}
        id="mobile-menu"
      >
        <NavLink to="/" className={getNavLinkClass} onClick={closeMobileMenu} end>
          Home
        </NavLink>
        <NavLink to="/cocktails" className={getNavLinkClass} onClick={closeMobileMenu}>
          Cocktails
        </NavLink>
        
        {!isLoading && user && (
          <>
            <NavLink to="/add-cocktail" className={getNavLinkClass} onClick={closeMobileMenu}>
              Add Cocktail
            </NavLink>
            <NavLink to="/my-favorites" className={getNavLinkClass} onClick={closeMobileMenu}>
              My Favorites
            </NavLink>
            <NavLink to="/profile" className={getNavLinkClass} onClick={closeMobileMenu}>
              Profile
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
        
        {!isLoading && !user && (
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

      {/* Mobile menu overlay */}
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