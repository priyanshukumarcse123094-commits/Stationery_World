/**
 * CustomerSidebar — §2.2 / §2.4
 *
 * Three-panel sidebar that SLIDES between views:
 *   main → categories → subcategories
 *
 * State lives in CategoryContext so Shop.jsx can react to
 * selectedCategory / selectedSubCategory.
 */
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useCategory } from '../context/CategoryContext';
import './customer.css';

const CATEGORY_META = {
  STATIONERY: { icon: '✏️', label: 'Stationery', color: '#d97706' },
  BOOKS:      { icon: '📚', label: 'Books',       color: '#2563eb' },
  TOYS:       { icon: '🧸', label: 'Toys',        color: '#16a34a' },
};

export default function CustomerSidebar({ onNavigate, products = [] }) {
  const cls = ({ isActive }) => (isActive ? 'active' : undefined);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    sidebarView,
    selectedCategory,
    selectedSubCategory,
    openCategories,
    openSubCategories,
    selectSubCategory,
    backToCategories,
    backToMain,
    resetCategory,
  } = useCategory();

  useEffect(() => {
    if (!location.pathname.startsWith('/customer')) resetCategory();
  }, [location.pathname, resetCategory]);

  const subCategories = selectedCategory
    ? [...new Set(
        products
          .filter(p => p.category === selectedCategory && p.subCategory)
          .map(p => p.subCategory.trim())
      )].sort()
    : [];

  const handleNavClick = () => { resetCategory(); onNavigate?.(); };

  const handleCategoryClick = (cat) => {
    openSubCategories(cat);
    if (location.pathname !== '/customer') navigate('/customer');
  };

  const handleSubCategoryClick = (sub) => {
    selectSubCategory(sub);
    if (location.pathname !== '/customer') navigate('/customer');
    onNavigate?.();
  };

  return (
    <aside className="customer-sidebar">
      <div className="customer-sidebar-brand">
        <div className="customer-sidebar-logo">Stationery World</div>
        <div className="customer-sidebar-tagline">Your Marketplace</div>
      </div>

      {/* Sliding panel wrapper */}
      <div className={`cs-panel-wrapper cs-panel--${sidebarView}`}>
        <div className="cs-panels-row">

          {/* ══ PANEL 1: MAIN NAV ══ */}
          <nav className="cs-panel cs-panel-main">
            <ul>
              <li>
                <NavLink to="/customer" end className={cls} onClick={handleNavClick}>
                  <span className="cs-icon">🏠</span> Home
                </NavLink>
              </li>
              <li>
                <NavLink to="/customer/you" className={cls} onClick={handleNavClick}>
                  <span className="cs-icon">👤</span> You
                </NavLink>
              </li>
              <li>
                <button className="cs-nav-btn cs-shopbycategory-btn" onClick={openCategories}>
                  <span className="cs-icon">🗂️</span>
                  <span className="cs-label">Shop By Category</span>
                  <span className="cs-arrow">›</span>
                </button>
              </li>
              <li>
                <NavLink to="/customer/wishlist" className={cls} onClick={handleNavClick}>
                  <span className="cs-icon">❤️</span> Wishlist
                </NavLink>
              </li>
              <li>
                <NavLink to="/customer/cart" className={cls} onClick={handleNavClick}>
                  <span className="cs-icon">🛒</span> Cart
                </NavLink>
              </li>
              <li>
                <NavLink to="/customer/orders" className={cls} onClick={handleNavClick}>
                  <span className="cs-icon">📦</span> Orders
                </NavLink>
              </li>
            </ul>
          </nav>

          {/* ══ PANEL 2: CATEGORY CHOOSER ══ */}
          <nav className="cs-panel cs-panel-categories">
            <div className="cs-panel-header">
              <button className="cs-back-btn" onClick={backToMain}>
                <span className="cs-back-arrow">‹</span> Back
              </button>
              <span className="cs-panel-title">Categories</span>
            </div>
            <ul className="cs-category-tiles">
              {Object.entries(CATEGORY_META).map(([key, meta]) => (
                <li key={key}>
                  <button
                    className={`cs-category-tile${selectedCategory === key ? ' active' : ''}`}
                    style={{ '--tile-color': meta.color }}
                    onClick={() => handleCategoryClick(key)}
                  >
                    <span className="cs-tile-icon">{meta.icon}</span>
                    <span className="cs-tile-label">{meta.label}</span>
                    <span className="cs-arrow">›</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* ══ PANEL 3: SUBCATEGORY LIST ══ */}
          <nav className="cs-panel cs-panel-subcategories">
            <div className="cs-panel-header">
              <button className="cs-back-btn" onClick={backToCategories}>
                <span className="cs-back-arrow">‹</span> Back
              </button>
              {selectedCategory && (
                <span className="cs-panel-title" style={{ color: CATEGORY_META[selectedCategory]?.color }}>
                  {CATEGORY_META[selectedCategory]?.icon} {CATEGORY_META[selectedCategory]?.label}
                </span>
              )}
            </div>

            {subCategories.length === 0 ? (
              <div className="cs-empty-subcats">No sub-categories yet</div>
            ) : (
              <ul className="cs-subcat-list">
                <li>
                  <button
                    className={`cs-subcat-item cs-subcat-all${selectedSubCategory === null ? ' active' : ''}`}
                    onClick={() => handleSubCategoryClick(null)}
                  >
                    <span className="cs-icon">🔍</span>
                    All {CATEGORY_META[selectedCategory]?.label}
                  </button>
                </li>
                {subCategories.map(sub => (
                  <li key={sub}>
                    <button
                      className={`cs-subcat-item${selectedSubCategory === sub ? ' active' : ''}`}
                      onClick={() => handleSubCategoryClick(sub)}
                    >
                      <span className="cs-subcat-dot">·</span>
                      {sub}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </nav>

        </div>{/* end cs-panels-row */}
      </div>{/* end cs-panel-wrapper */}
    </aside>
  );
}
