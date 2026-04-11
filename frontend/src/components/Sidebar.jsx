/**
 * Admin Sidebar — §2.4
 * Three-panel sliding behavior for Shop By Category.
 * Clicking a subCategory navigates to /admin/shopping?category=X&sub=Y
 */
import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import '../../Style/dashboard.css';
import { useSidebar } from '../context/SidebarContext';

const CATEGORY_META = {
  STATIONERY: { icon: '✏️', label: 'Stationery', color: '#d97706' },
  BOOKS:      { icon: '📚', label: 'Books',       color: '#2563eb' },
  TOYS:       { icon: '🧸', label: 'Toys',        color: '#16a34a' },
};

const Sidebar = ({ products = [] }) => {
  const { open, setOpen }                             = useSidebar();
  const sidebarRef                                    = useRef(null);
  const navigate                                      = useNavigate();
  const [view, setView]                               = useState('main');
  const [activeCategory, setActiveCategory]           = useState(null);
  const [activeSubCategory, setActiveSubCategory]     = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (open && sidebarRef.current && !sidebarRef.current.contains(e.target) && !e.target.closest('.sidebar-toggle')) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) { setView('main'); setActiveCategory(null); setActiveSubCategory(null); }
  }, [open]);

  const subCategories = activeCategory
    ? [...new Set(products.filter(p => p.category === activeCategory && p.subCategory).map(p => p.subCategory.trim()))].sort()
    : [];

  const handleSubCategoryClick = (sub) => {
    setActiveSubCategory(sub);
    const params = sub
      ? `?category=${activeCategory}&sub=${encodeURIComponent(sub)}`
      : `?category=${activeCategory}`;
    navigate(`/admin/shopping${params}`);
  };

  const navCls = ({ isActive }) => (isActive ? 'active' : '');

  return (
    <aside ref={sidebarRef} className={`sidebar ${open ? 'open' : 'closed'}`}>
      <h3 className="sidebar-title">Admin Panel</h3>

      <div className={`sidebar-panel-wrapper sidebar-panel--${view}`}>
        <div className="sidebar-panels-row">

          {/* ══ PANEL 1: MAIN NAV ══ */}
          <nav className="sidebar-panel sidebar-panel-main">
            <NavLink to="/admin/dashboard" className={navCls}><span className="icon">🏠</span><span className="text">Dashboard</span></NavLink>
            <NavLink to="/admin/reports"   className={navCls}><span className="icon">📊</span><span className="text">Reports</span></NavLink>
            <NavLink to="/admin/inventory" className={navCls}><span className="icon">📦</span><span className="text">Inventory</span></NavLink>
            <NavLink to="/admin/orders"    className={navCls}><span className="icon">🧾</span><span className="text">Orders</span></NavLink>
            <NavLink to="/admin/users"     className={navCls}><span className="icon">👥</span><span className="text">Users</span></NavLink>
            <NavLink to="/admin/bargain-requests" className={navCls}><span className="icon">🤝</span><span className="text">Bargain</span></NavLink>
            <NavLink to="/admin/shopping"  className={navCls}><span className="icon">🛒</span><span className="text">Shopping</span></NavLink>
            <button className="sidebar-nav-btn" onClick={() => setView('categories')}>
              <span className="icon">🗂️</span>
              <span className="text">Shop By Category</span>
              <span className="sidebar-arrow">›</span>
            </button>
            <NavLink to="/admin/wishlist"  className={navCls}><span className="icon">💖</span><span className="text">Wishlist</span></NavLink>
            <div className="sidebar-divider" />
            <NavLink to="/admin/profile"   className={navCls}><span className="icon">👤</span><span className="text">Profile</span></NavLink>
          </nav>

          {/* ══ PANEL 2: CATEGORIES ══ */}
          <nav className="sidebar-panel sidebar-panel-categories">
            <div className="sidebar-panel-header">
              <button className="sidebar-back-btn" onClick={() => setView('main')}>
                <span>‹</span> Back
              </button>
              <span className="sidebar-panel-title">Categories</span>
            </div>
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <button
                key={key}
                className={`sidebar-category-tile${activeCategory === key ? ' active' : ''}`}
                style={{ '--tile-color': meta.color }}
                onClick={() => { setActiveCategory(key); setActiveSubCategory(null); setView('subcategories'); }}
              >
                <span className="icon">{meta.icon}</span>
                <span className="text">{meta.label}</span>
                <span className="sidebar-arrow">›</span>
              </button>
            ))}
          </nav>

          {/* ══ PANEL 3: SUBCATEGORIES ══ */}
          <nav className="sidebar-panel sidebar-panel-subcategories">
            <div className="sidebar-panel-header">
              <button className="sidebar-back-btn" onClick={() => setView('categories')}>
                <span>‹</span> Back
              </button>
              {activeCategory && (
                <span className="sidebar-panel-title" style={{ color: CATEGORY_META[activeCategory]?.color }}>
                  {CATEGORY_META[activeCategory]?.icon} {CATEGORY_META[activeCategory]?.label}
                </span>
              )}
            </div>

            {subCategories.length === 0 ? (
              <div className="sidebar-empty-subcats">No sub-categories yet</div>
            ) : (
              <>
                <button
                  className={`sidebar-subcat-item sidebar-subcat-all${!activeSubCategory ? ' active' : ''}`}
                  onClick={() => handleSubCategoryClick(null)}
                >
                  <span className="icon">🔍</span><span className="text">All {CATEGORY_META[activeCategory]?.label}</span>
                </button>
                {subCategories.map(sub => (
                  <button
                    key={sub}
                    className={`sidebar-subcat-item${activeSubCategory === sub ? ' active' : ''}`}
                    onClick={() => handleSubCategoryClick(sub)}
                  >
                    <span className="icon" style={{ fontSize: 10, opacity: 0.4 }}>·</span>
                    <span className="text">{sub}</span>
                  </button>
                ))}
              </>
            )}
          </nav>

        </div>{/* sidebar-panels-row */}
      </div>{/* sidebar-panel-wrapper */}
    </aside>
  );
};

export default Sidebar;
