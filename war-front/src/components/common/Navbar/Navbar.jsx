import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import useNavbar from './useNavbar';
import NavbarHandler from './NavbarHandler';
import styles from './Navbar.module.scss';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user, isAdmin } = useAuth();
  const { stateNavbar, setNavbar } = useNavbar();
  const handlers = NavbarHandler(stateNavbar, setNavbar);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className={styles.LogoButton}
            aria-label="Home"
          >
            <img
              src={`${process.env.PUBLIC_URL}/common/logo.png`}
              alt="War Room Logo"
              className={styles.NavLogo}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </button>

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
          </div>

          {/* Auth Buttons */}
          <div className={styles.AuthButtons}>
            {isAuthenticated ? (
              <div className={styles.UserMenu} ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={styles.AvatarButton}
                  aria-label="User menu"
                >
                  <div className={styles.Avatar}>
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className={styles.UserName}>{user?.username}</span>
                  <span className={`material-icons ${styles.DropdownIcon} ${dropdownOpen ? styles.DropdownIconOpen : ''}`}>
                    expand_more
                  </span>
                </button>

                {dropdownOpen && (
                  <div className={styles.Dropdown}>
                    <div className={styles.DropdownHeader}>
                      <div className={styles.DropdownAvatar}>
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className={styles.DropdownUserInfo}>
                        <span className={styles.DropdownUsername}>{user?.username}</span>
                        <span className={styles.DropdownRole}>{user?.role || 'User'}</span>
                      </div>
                    </div>
                    <div className={styles.DropdownDivider}></div>
                    
                    {isAdmin && (
                      <>
                        <div className={styles.DropdownSection}>
                          <span className={styles.DropdownSectionTitle}>Admin</span>
                          <button
                            onClick={() => { navigate('/admin/charities'); setDropdownOpen(false); }}
                            className={styles.DropdownItem}
                          >
                            <span className="material-icons">volunteer_activism</span>
                            <span>Charity Dashboard</span>
                          </button>
                        </div>
                        <div className={styles.DropdownDivider}></div>
                      </>
                    )}
                    
                    <button
                      onClick={() => { logout(); setDropdownOpen(false); }}
                      className={`${styles.DropdownItem} ${styles.DropdownItemLogout}`}
                    >
                      <span className="material-icons">logout</span>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
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
            <div className={styles.MobileDivider}></div>
            {isAuthenticated ? (
              <>
                <div className={styles.MobileUserInfo}>
                  <div className={styles.MobileAvatar}>
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className={styles.MobileUserDetails}>
                    <span className={styles.MobileUsername}>{user?.username}</span>
                    <span className={styles.MobileRole}>{user?.role || 'User'}</span>
                  </div>
                </div>
                {isAdmin && (
                  <>
                    <div className={styles.MobileDivider}></div>
                    <div className={styles.MobileSectionTitle}>Admin Dashboards</div>
                    <button onClick={() => { navigate('/admin/charities'); handlers.toggleMobileMenu(); }} className={styles.MobileMenuItem}>
                      <span className="material-icons">volunteer_activism</span>
                      Charity Dashboard
                    </button>
                  </>
                )}
                <div className={styles.MobileDivider}></div>
                <button onClick={() => { logout(); handlers.toggleMobileMenu(); }} className={`${styles.MobileMenuItem} ${styles.MobileLogout}`}>
                  <span className="material-icons">logout</span>
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
