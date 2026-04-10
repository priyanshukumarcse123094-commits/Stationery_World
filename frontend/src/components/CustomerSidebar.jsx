import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './customer.css';

export default function CustomerSidebar({ onNavigate }) {
  const cls = ({ isActive }) => isActive ? 'active' : undefined;
  const [categoryOpen, setCategoryOpen] = useState(false);
  const navigate = useNavigate();

  const handleCategoryClick = () => {
    setCategoryOpen(prev => !prev);
    navigate('/customer');
    setTimeout(() => {
      const el = document.getElementById('categories');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  };

  return (
    <aside className="customer-sidebar">
      <div className="customer-sidebar-brand">
        <div className="customer-sidebar-logo">Stationery World</div>
        <div className="customer-sidebar-tagline">Your Marketplace</div>
      </div>
      <nav>
        <ul>
          <li>
            <NavLink to="/customer" end className={cls} onClick={onNavigate}>
              <span className="cs-icon">🏠</span> Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/customer/you" className={cls} onClick={onNavigate}>
              <span className="cs-icon">👤</span> You
            </NavLink>
          </li>

          {/* Shop By Category — new per §2.2 / §2.4 */}
          <li className="cs-category-entry">
            <button
              className={`cs-category-toggle${categoryOpen ? ' open' : ''}`}
              onClick={handleCategoryClick}
              aria-expanded={categoryOpen}
            >
              <span className="cs-icon">🗂️</span>
              <span className="cs-label">Shop By Category</span>
              <span className="cs-chevron">{categoryOpen ? '▲' : '▾'}</span>
            </button>
            <ul className={`cs-subcategory-list${categoryOpen ? ' visible' : ''}`}>
              {[
                { key: 'STATIONERY', icon: '✏️' },
                { key: 'BOOKS',      icon: '📚' },
                { key: 'TOYS',       icon: '🧸' },
              ].map(({ key, icon }) => (
                <li key={key}>
                  <NavLink
                    to={`/customer?category=${key}`}
                    className={cls}
                    onClick={onNavigate}
                  >
                    <span className="cs-icon">{icon}</span>
                    {key.charAt(0) + key.slice(1).toLowerCase()}
                  </NavLink>
                </li>
              ))}
            </ul>
          </li>

          <li>
            <NavLink to="/customer/wishlist" className={cls} onClick={onNavigate}>
              <span className="cs-icon">❤️</span> Wishlist
            </NavLink>
          </li>
          <li>
            <NavLink to="/customer/cart" className={cls} onClick={onNavigate}>
              <span className="cs-icon">🛒</span> Cart
            </NavLink>
          </li>
          <li>
            <NavLink to="/customer/orders" className={cls} onClick={onNavigate}>
              <span className="cs-icon">📦</span> Orders
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
