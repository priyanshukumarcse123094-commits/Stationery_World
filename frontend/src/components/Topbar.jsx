import "../../Style/dashboard.css";
import { useState, useRef, useEffect } from "react";
import { useSidebar } from "../context/SidebarContext";
import { useTheme } from "../context/ThemeContext";
import { Link, useNavigate } from 'react-router-dom';
import { authUtils } from "../utils/auth";
import { useSearch } from "../context/SearchContext";
import SearchDropdown from "./SearchDropdown";
import Logo from "./Logo";
import { Search, X, Sun, Moon, ShoppingCart, Menu } from 'lucide-react';
import { API_BASE_URL } from "../config/constants";

const DEFAULT_AVATAR_CUSTOMER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 150 150'%3E%3Ccircle cx='75' cy='75' r='75' fill='%234d7260'/%3E%3Cpath d='M75 40c-11 0-20 9-20 20s9 20 20 20 20-9 20-20-9-20-20-20zm0 60c-16.5 0-30 8.5-30 19v6h60v-6c0-10.5-13.5-19-30-19z' fill='%23fff'/%3E%3C/svg%3E";
const DEFAULT_AVATAR_ADMIN    = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 150 150'%3E%3Ccircle cx='75' cy='75' r='75' fill='%23c0714f'/%3E%3Cpath d='M75 40c-11 0-20 9-20 20s9 20 20 20 20-9 20-20-9-20-20-20zm0 60c-16.5 0-30 8.5-30 19v6h60v-6c0-10.5-13.5-19-30-19z' fill='%23fff'/%3E%3C/svg%3E";

const getImageUrl = (photoUrl, userRole) => {
  if (!photoUrl) return userRole === 'ADMIN' ? DEFAULT_AVATAR_ADMIN : DEFAULT_AVATAR_CUSTOMER;
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://') || photoUrl.startsWith('data:')) return photoUrl;
  if (photoUrl.startsWith('/uploads/')) return `${API_BASE_URL}${photoUrl}`;
  return photoUrl;
};

const MenuIcon = () => <Menu size={18} strokeWidth={2} aria-hidden="true" />;

const CloseIcon = () => <X size={18} strokeWidth={2} aria-hidden="true" />;

const Topbar = ({
  variant = 'admin',
  wishlistCount = 0,
  cartCount = 0,
  onToggleSidebar,
  sidebarOpen: customerSidebarOpen = false,
}) => {
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar();
  const { theme, toggle: toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const searchRef   = useRef(null);
  const navigate    = useNavigate();
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  const { searchQuery, searchResults, isSearching, placeholder, resultRenderer, performSearch, clearSearch } = useSearch();

  const [user, setUser] = useState(authUtils.getUser());
  const userRole  = user?.role || 'CUSTOMER';
  const userPhoto = getImageUrl(user?.photoUrl, userRole);
  const userName  = user?.name || 'User';
  const isAdmin   = variant === 'admin';
  const isOpen    = isAdmin ? sidebarOpen : customerSidebarOpen;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (variant === 'customer' && user?.role === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    } else if (variant === 'admin' && user?.role === 'CUSTOMER') {
      navigate('/customer', { replace: true });
    }
  }, [user, variant, navigate]);

  useEffect(() => {
    const onUpdate = (e) => setUser(e.detail);
    window.addEventListener('userUpdated', onUpdate);
    return () => window.removeEventListener('userUpdated', onUpdate);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const clickedInsideDropdown = dropdownRef.current && dropdownRef.current.contains(e.target);
      const clickedInsideMobileMenu = mobileMenuRef.current && mobileMenuRef.current.contains(e.target);
      if (!clickedInsideDropdown && !clickedInsideMobileMenu) setOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.querySelector('input')?.focus();
      }
      if (e.key === 'Escape') { setShowSearchDropdown(false); clearSearch(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [clearSearch]);

  const handleSearchChange = (e) => {
    const q = e.target.value;
    performSearch(q);
    setShowSearchDropdown(q.trim().length > 0);
  };

  const handleLogout = () => {
    authUtils.logout();
    navigate(isAdmin ? '/admin' : '/', { replace: true });
  };

  const handleProfile = () => {
    navigate(isAdmin ? '/admin/profile' : '/customer/you');
    setOpen(false);
  };

  const handleLogoAction = () => {
    if (isMobile) {
      return isAdmin ? setSidebarOpen(!sidebarOpen) : onToggleSidebar?.();
    }
    navigate(isAdmin ? '/admin/dashboard' : '/customer');
  };

  return (
    <header className="topbar" data-variant={variant}>

      {/* Left: toggle + brand */}
      <div
        className="topbar-left"
        ref={mobileMenuRef}
      >
        {isMobile ? (
          <button
            className="topbar-logo-btn"
            aria-label="Stationery World"
            onClick={handleLogoAction}
          >
            <Logo size={26} />
          </button>
        ) : (
          <>
            <button
              className={`sidebar-toggle${isOpen ? ' open' : ''}`}
              aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
              onClick={() => isAdmin ? setSidebarOpen(!sidebarOpen) : onToggleSidebar?.()}
            >
              <span className="toggle-icon-wrap">
                <span className={`toggle-icon toggle-icon--menu${isOpen ? ' hidden' : ''}`}><MenuIcon /></span>
                <span className={`toggle-icon toggle-icon--close${isOpen ? '' : ' hidden'}`}><CloseIcon /></span>
              </span>
            </button>
            <span className="topbar-brand">
              <Logo size={26} />
              <span className="topbar-brand-text">
                Stationery World
              </span>
            </span>
          </>
        )}
      </div>

      {/* Centre: search */}
      <div className="topbar-search" role="search" ref={searchRef}>
        <div className="search-input-wrap">
          <span className="search-icon" aria-hidden="true"><Search size={14} /></span>
          <input
            type="text"
            aria-label="Search"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { clearSearch(); setShowSearchDropdown(false); }
              if (e.key === 'Enter') { setShowSearchDropdown(false); }
            }}
            autoComplete="off"
            spellCheck="false"
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => { clearSearch(); setShowSearchDropdown(false); }} aria-label="Clear">
              <X size={14} />
            </button>
          )}
          <kbd className="search-shortcut">⌘K</kbd>
        </div>

        {showSearchDropdown && (
          <SearchDropdown
            results={searchResults}
            isSearching={isSearching}
            query={searchQuery}
            resultRenderer={resultRenderer}
            onClose={() => setShowSearchDropdown(false)}
          />
        )}
      </div>

      {/* Right: actions */}
      <div className={`topbar-actions${isMobile ? ' topbar-actions-mobile' : ''}`} ref={dropdownRef} data-mobile-collapse={isMobile}>

        {/* Theme toggle */}
        <button className={`icon-link${isMobile ? ' icon-compact' : ''}`} onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'} style={{ fontSize: 0 }}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Customer quick links */}
        {!isAdmin && (
          <div className="topbar-icons" role="navigation" aria-label="Customer quick actions">
            {!isMobile && (
              <Link to="/customer/wishlist" title="Wishlist" className="icon-link wishlist-link">
                ❤️ <span className="count">{wishlistCount}</span>
              </Link>
            )}
            <Link to="/customer/cart" title="Cart" className={`icon-link cart-link${isMobile ? ' icon-compact cart-icon-btn' : ''}`}>
              <ShoppingCart size={16} />
              <span className="count">{cartCount}</span>
            </Link>
          </div>
        )}

        {/* Username + badge */}
        {!isMobile && (
          <span className="topbar-username">
            {userName}
            {isAdmin && <span className="topbar-badge-admin">ADMIN</span>}
          </span>
        )}

        {/* Avatar + dropdown */}
        <div
          className="topbar-admin"
          onClick={() => setOpen(!open)}
        >
          <img
            src={userPhoto}
            alt={userName}
            aria-haspopup="true"
            style={{ border: isAdmin ? '2px solid var(--terra)' : '2px solid var(--sage)' }}
            onError={(e) => { e.target.src = isAdmin ? DEFAULT_AVATAR_ADMIN : DEFAULT_AVATAR_CUSTOMER; }}
          />
        </div>

        {open && (
          <div className={`admin-dropdown${isMobile ? ' admin-dropdown-mobile' : ''}`} role="menu">
            <button role="menuitem" onClick={handleProfile}>Profile</button>
            <button role="menuitem" className="logout" onClick={handleLogout}>Logout</button>
          </div>
        )}

      </div>
    </header>
  );
};

export default Topbar;
