// frontend/src/components/layout/Navbar/Navbar.tsx
import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import styles from './Navbar.module.css';

const Navbar: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink;


  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.logoLink}>
        KoktajLOVE
      </Link>
      <div className={styles.navLinks}>
        <NavLink to="/" className={getNavLinkClass} end>
          Home
        </NavLink>
        <NavLink to="/cocktails" className={getNavLinkClass}> {/* Assuming a /cocktails route for listing */}
          Cocktails
        </NavLink>
        
        {!isLoading && user && (
          <>
            <NavLink to="/add-cocktail" className={getNavLinkClass}>
              Add Cocktail
            </NavLink>
            <NavLink to="/my-favorites" className={getNavLinkClass}>
              My Favorites
            </NavLink>
            <NavLink to="/profile" className={getNavLinkClass}>
              My Profile
            </NavLink>
            <button onClick={handleLogout} className={`${styles.navLink} ${styles.logoutButton}`}>
              Logout
            </button>
          </>
        )}
        {!isLoading && !user && (
          <>
            <NavLink to="/login" className={getNavLinkClass}>
              Login
            </NavLink>
            <NavLink to="/register" className={getNavLinkClass}>
              Register
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;