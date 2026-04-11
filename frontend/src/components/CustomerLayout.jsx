import CustomerSidebar from './CustomerSidebar';
import Topbar from './Topbar';
import CartoonMascot from './CartoonMascot';
import '../../Style/shop.css';
import './customer.css';
import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CategoryProvider } from '../context/CategoryContext';

export default function CustomerLayout() {
  const location = useLocation();
  const [showSidebar, setShowSidebar]   = useState(false);
  const [animatePage, setAnimatePage]   = useState(true);
  // Products are fetched in Shop.jsx; we lift them up here so
  // the sidebar can derive subCategories from live data.
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const activateTimer = window.setTimeout(() => setAnimatePage(true), 0);
    const timer = window.setTimeout(() => setAnimatePage(false), 520);
    return () => { window.clearTimeout(activateTimer); window.clearTimeout(timer); };
  }, [location.pathname]);

  return (
    <CategoryProvider>
      <div className={`customer-layout ${showSidebar ? 'sidebar-open' : ''}`}>
        <CustomerSidebar
          onNavigate={() => setShowSidebar(false)}
          products={products}
        />
        <div className="customer-main">
          <Topbar
            variant="customer"
            sidebarOpen={showSidebar}
            onToggleSidebar={() => setShowSidebar(s => !s)}
          />
          {showSidebar && (
            <div
              className="customer-sidebar-backdrop"
              onClick={() => setShowSidebar(false)}
              aria-hidden="true"
            />
          )}
          <main className={`customer-content${animatePage ? ' page-transition' : ''}`}>
            {/* Pass setProducts down via Outlet context so Shop.jsx can share its product list */}
            <Outlet context={{ setProducts }} />
          </main>
        </div>
        <CartoonMascot position="bottom-right" />
      </div>
    </CategoryProvider>
  );
}
