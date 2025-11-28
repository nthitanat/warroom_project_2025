import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import useNavbar from './useNavbar';
import NavbarHandler from './NavbarHandler';
import styles from './Navbar.module.scss';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const { stateNavbar, setNavbar } = useNavbar();
  const handlers = NavbarHandler(stateNavbar, setNavbar);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/warroom') return { main: 'Digital', highlight: 'War Room' };
    if (path === '/analytics') return { main: 'Analytic', highlight: 'Maps' };
    if (path === '/lessons') return { main: 'Lesson', highlight: 'Learned' };
    if (path === '/charities') return { main: '', highlight: 'Contributions' };
    return null;
  };

  const pageTitle = getPageTitle();
  const showBanner = ['/analytics', '/warroom', '/lessons', '/charities'].includes(location.pathname);

  return (
    <div className={styles.Container}>
      <nav className={styles.Navbar}>
        <div className={styles.NavContent}>
          {/* Desktop Navigation */}
          <div className={styles.NavLinks}>
            <button
              onClick={() => navigate('/')}
              className={`${styles.NavLink} ${location.pathname === '/' ? styles.NavLinkActive : ''}`}
            >
              About
            </button>
            <button
              onClick={() => navigate('/analytics')}
              className={`${styles.NavLink} ${location.pathname === '/analytics' ? styles.NavLinkActive : ''}`}
            >
              Analytics
            </button>
            <button
              onClick={() => navigate('/warroom')}
              className={`${styles.NavLink} ${location.pathname === '/warroom' ? styles.NavLinkActive : ''}`}
            >
              War Room
            </button>
            <button
              onClick={() => navigate('/lessons')}
              className={`${styles.NavLink} ${location.pathname === '/lessons' ? styles.NavLinkActive : ''}`}
            >
              Flood Lesson
            </button>
            <button
              onClick={() => navigate('/charities')}
              className={`${styles.NavLink} ${location.pathname === '/charities' ? styles.NavLinkActive : ''}`}
            >
              Charities
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin-dashboard')}
                className={`${styles.NavLink} ${styles.NavLinkAdmin} ${location.pathname === '/admin-dashboard' ? styles.NavLinkActive : ''}`}
              >
                Admin
              </button>
            )}
          </div>

          {/* Auth Buttons */}
          <div className={styles.AuthButtons}>
            {isAuthenticated ? (
              <>
                <span className={styles.UserName}>{user?.username}</span>
                <button onClick={logout} className={styles.LogoutButton}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/signin')}
                  className={styles.SignInButton}
                >
                  Sign in
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className={styles.SignUpButton}
                >
                  Sign up
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={handlers.toggleMobileMenu}
            className={styles.MobileMenuButton}
            aria-label="Toggle menu"
          >
            {stateNavbar.mobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        {stateNavbar.mobileMenuOpen && (
          <div className={styles.MobileMenu}>
            <button onClick={() => { navigate('/'); handlers.toggleMobileMenu(); }} className={styles.MobileMenuItem}>
              Home
            </button>
            <button onClick={() => { navigate('/analytics'); handlers.toggleMobileMenu(); }} className={styles.MobileMenuItem}>
              Analytics
            </button>
            <button onClick={() => { navigate('/warroom'); handlers.toggleMobileMenu(); }} className={styles.MobileMenuItem}>
              War Room
            </button>
            <button onClick={() => { navigate('/lessons'); handlers.toggleMobileMenu(); }} className={styles.MobileMenuItem}>
              Flood Lesson Learned
            </button>
            <button onClick={() => { navigate('/charities'); handlers.toggleMobileMenu(); }} className={styles.MobileMenuItem}>
              Charities
            </button>
            {user?.role === 'admin' && (
              <button onClick={() => { navigate('/admin-dashboard'); handlers.toggleMobileMenu(); }} className={styles.MobileMenuItem}>
                Admin Dashboard
              </button>
            )}
            <div className={styles.MobileDivider}></div>
            {isAuthenticated ? (
              <>
                <div className={styles.MobileUserInfo}>{user?.username}</div>
                <button onClick={() => { logout(); handlers.toggleMobileMenu(); }} className={styles.MobileMenuItem}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { navigate('/signin'); handlers.toggleMobileMenu(); }} className={styles.MobileMenuItem}>
                  Sign in
                </button>
                <button onClick={() => { navigate('/signup'); handlers.toggleMobileMenu(); }} className={styles.MobileMenuItem}>
                  Sign up
                </button>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Page Banner */}
      {showBanner && pageTitle && (
        <div className={styles.Banner}>
          <div className={styles.BannerContent}>
            <img
              src="/common/logo.png"
              alt="Logo"
              className={styles.Logo}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <h1 className={styles.BannerTitle}>
              {pageTitle.main && <span className={styles.BannerMain}>{pageTitle.main} </span>}
              <span className={styles.BannerHighlight}>{pageTitle.highlight}</span>
            </h1>
          </div>
        </div>
      )}
    </div>
  );
}
