import CustomerSidebar from './CustomerSidebar';
import Topbar from './Topbar';
import CartoonMascot from './CartoonMascot';
import '../../Style/shop.css';
import './customer.css';
import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function CustomerLayout() {
  const location = useLocation();
  const [showSidebar, setShowSidebar] = useState(false);
  const [animatePage, setAnimatePage] = useState(true);

  useEffect(() => {
    setAnimatePage(true);
    const timer = window.setTimeout(() => setAnimatePage(false), 520);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className={`customer-layout ${showSidebar ? 'sidebar-open' : ''}`}>
      <CustomerSidebar onNavigate={() => setShowSidebar(false)} />
      <div className="customer-main">
        <Topbar
          variant="customer"
          sidebarOpen={showSidebar}
          onToggleSidebar={() => setShowSidebar(s => !s)}
        />
        {/* Backdrop overlay — closes sidebar when tapping outside on mobile */}
        {showSidebar && (
          <div
            className="customer-sidebar-backdrop"
            onClick={() => setShowSidebar(false)}
            aria-hidden="true"
          />
        )}
        <main
          className={`customer-content${animatePage ? ' page-transition' : ''}`}
        >
          <Outlet />
        </main>
      </div>
      {/* Subtle animated mascot to brighten the page */}
      <CartoonMascot position="bottom-right" />
    </div>
  );
}