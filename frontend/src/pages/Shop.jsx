import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useSearchParams, useOutletContext } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useSearch } from '../context/SearchContext';
import { useCategory } from '../context/CategoryContext';
import Hero from '../components/shop/Hero';
import CategoryStrip from '../components/shop/CategoryStrip';
import ProductGrid from '../components/shop/ProductGrid';
import ProductDetailModal from '../components/shop/ProductDetailModal';
import { Loader, X, Search, Sparkles } from 'lucide-react';
import '../../Style/shop.css';
import { API_BASE_URL } from '../config/constants';

const API = API_BASE_URL;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Fire-and-forget interaction tracker. Never throws. */
const trackInteraction = (productId, type, searchTerm = null) => {
  const token = localStorage.getItem('token');
  if (!token || !productId) return;
  fetch(`${API}/api/products/track-interaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ productId, type, searchTerm: searchTerm || undefined })
  }).catch(() => {});
};

/** Debounce hook */
const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

// ─────────────────────────────────────────────────────────────────────────────

export default function Shop() {
  const [products, setProductsState]          = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery]         = useState('');
  const [sortBy, setSortBy]                   = useState('featured');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeSearch, setActiveSearch]       = useState('');
  const [isPersonalised, setIsPersonalised]   = useState(false);

  const { showToast }       = useToast();
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const { registerSearchHandler, unregisterSearchHandler, searchQuery: topbarQuery, clearSearch } = useSearch();
  const location            = useLocation();
  const [searchParams]      = useSearchParams();

  // §2.4: Share products with CustomerLayout so sidebar can derive subCategories
  const outletCtx = useOutletContext();
  const setProducts = useCallback((data) => {
    setProductsState(data);
    outletCtx?.setProducts?.(data);
  }, [outletCtx]);

  // §2.4: Category context from sidebar — drives filtering when sidebar is used
  const {
    selectedCategory: sidebarCategory,
    selectedSubCategory: sidebarSubCategory,
    sidebarView,
  } = useCategory() || {};

  // §2.4: When sidebar drives a category selection, sync selectedCategory
  useEffect(() => {
    if (sidebarCategory) {
      setSelectedCategory(sidebarCategory);
    } else if (sidebarView === 'main') {
      // Sidebar returned to main — don't force reset, keep toolbar state
    }
  }, [sidebarCategory, sidebarView]);

  // §2.4: Remove old ?category= param handler (now driven by context)
  // Keep it as fallback for direct URL links
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && ['STATIONERY', 'BOOKS', 'TOYS'].includes(cat)) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);
  const [buyNowProduct, setBuyNowProduct]     = useState(null);
  const [buyNowQty, setBuyNowQty]             = useState(1);
  const [buyNowLoading, setBuyNowLoading]     = useState(false);
  const [buyNowForm, setBuyNowForm]           = useState({
    recipientName: '', recipientPhone: '', addressLine1: '', addressLine2: '',
    city: '', state: '', postalCode: '', country: '', note: ''
  });

  const committedSearch      = useDebounce(activeSearch, 350);
  const debouncedSearchQuery = useDebounce(searchQuery, 350);

  const categories = useMemo(() => ['All', 'STATIONERY', 'BOOKS', 'TOYS'], []);

  // ── Reset on sidebar "Home" click ─────────────────────────────────────────
  useEffect(() => {
    setSelectedCategory('All');
    setSortBy('featured');
    setActiveSearch('');
    setSearchQuery('');
    clearSearch();
  }, [location.key, clearSearch]);

  // ── Wishlist IDs ──────────────────────────────────────────────────────────
  const fetchWishlistIds = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API}/api/wishlist`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setWishlistIds(new Set((result.data || []).map(w => w.productId)));
    } catch (err) {
      console.error('Failed to fetch wishlist IDs:', err);
    }
  }, []);

  useEffect(() => { fetchWishlistIds(); }, [fetchWishlistIds]);

  // ── Topbar search dropdown ────────────────────────────────────────────────
  useEffect(() => {
    const searchProducts = async (query) => {
      const trimmed = query.trim();
      if (!trimmed) return [];

      const qs = new URLSearchParams({ search: trimmed, limit: '8', _t: Date.now() });
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/products/customer/search?${qs}`,
        { headers: { 'Cache-Control': 'no-cache', ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
      );
      const result = await response.json();
      if (!result.success) return [];

      return (result.data || []).map(p => ({
        id: p.id,
        title: p.name,
        subtitle: `${p.category} · ₹${parseFloat(p.baseSellingPrice).toFixed(2)} · ${p.totalStock} in stock`,
        badge: p.category,
        image: p.images?.find(i => i.isPrimary)?.url || p.images?.[0]?.url || null,
        onClick: () => {
          setSelectedProduct(p);
          setShowDetailModal(true);
          trackInteraction(p.id, 'VIEW');
          trackInteraction(p.id, 'SEARCH', trimmed);
        }
      }));
    };

    registerSearchHandler('products', searchProducts, 'Search products… press Enter to filter page');
    return () => unregisterSearchHandler();
  }, [registerSearchHandler, unregisterSearchHandler]);

  // ── Enter key commits topbar search ──────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        const isTopbar = document.activeElement?.closest('.topbar-search');
        if (isTopbar && topbarQuery.trim()) {
          setActiveSearch(topbarQuery.trim());
          setSearchQuery(topbarQuery.trim());
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [topbarQuery]);

  // ── Core product fetch ────────────────────────────────────────────────────
  // ALWAYS fetches fresh from DB — no browser cache used.
  // On home (no search, All category, featured sort) → random 20 via recommended API.
  // On search → smart search API with relevance scoring.
  // On browse → customer catalog API with filters.
  const fetchProducts = useCallback(async ({ query = '' } = {}) => {
    try {
      setLoading(true);
      setIsPersonalised(false);

      const token = localStorage.getItem('token');
      const trimmed = query.trim();
      const ts = Date.now(); // cache-busting timestamp

      // A. Personalised / random home feed
      if (token && !trimmed && selectedCategory === 'All' && sortBy === 'featured') {
        try {
          // random=true forces a fresh shuffle on every load
          const recRes = await fetch(
            `${API}/api/products/recommended?limit=20&random=true&_t=${ts}`,
            { headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' } }
          );
          const recResult = await recRes.json();
          if (recResult.success && recResult.data?.length > 0) {
            setProducts(recResult.data);
            setIsPersonalised(true);
            setError(null);
            return;
          }
        } catch (err) {
          console.error('Recommended products fetch failed:', err);
        }
        // Fallback: random from customer endpoint (works without history)
        try {
          const fbRes = await fetch(
            `${API}/api/products/customer?random=true&limit=20&_t=${ts}`,
            { headers: token ? { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' } : { 'Cache-Control': 'no-cache' } }
          );
          const fbResult = await fbRes.json();
          if (fbResult.success && fbResult.data?.length > 0) {
            setProducts(fbResult.data);
            setIsPersonalised(true);
            setError(null);
            return;
          }
        } catch (err) {
          console.error('Fallback recommended fetch failed:', err);
        }
      }

      // B. Search mode — always from API, never local/cached
      if (trimmed) {
        const params = new URLSearchParams({
          search: trimmed, limit: '20', page: '1', _t: ts
        });
        if (selectedCategory !== 'All') params.set('category', selectedCategory);

        // Try smart customer search endpoint first
        try {
          const response = await fetch(
            `${API}/api/products/customer/search?${params}`,
            { headers: { 'Cache-Control': 'no-cache', ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
          );
          const result = await response.json();
          if (result.success) {
            setProducts(result.data || []);
            setError(null);
            return;
          }
        } catch (err) {
          console.error('Customer search endpoint failed:', err);
        }

        // Fallback to generic search if customer/search not available
        const fallbackParams = new URLSearchParams({ search: trimmed, limit: '20', _t: ts });
        if (selectedCategory !== 'All') fallbackParams.set('category', selectedCategory);
        const fbRes = await fetch(
          `${API}/api/products?${fallbackParams}`,
          { headers: { 'Cache-Control': 'no-cache', ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
        );
        const fbResult = await fbRes.json();
        if (!fbResult.success) throw new Error(fbResult.message);
        setProducts(fbResult.data || []);
        setError(null);
        return;
      }

      // C. Browsing with filters / sort — always fresh from customer endpoint
      const params = new URLSearchParams({ limit: '20', page: '1', _t: ts });
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      if (sortBy && sortBy !== 'featured') params.set('sortBy', sortBy);

      try {
        const response = await fetch(
          `${API}/api/products/customer?${params}`,
          { headers: { 'Cache-Control': 'no-cache', ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
        );
        const result = await response.json();
        if (result.success) {
          let data = result.data || [];
          // Client-side sort for options the API may not handle
          if (sortBy === 'newest') data = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          else if (sortBy === 'price-low') data = [...data].sort((a, b) => parseFloat(a.baseSellingPrice) - parseFloat(b.baseSellingPrice));
          else if (sortBy === 'price-high') data = [...data].sort((a, b) => parseFloat(b.baseSellingPrice) - parseFloat(a.baseSellingPrice));
          else if (sortBy === 'name') data = [...data].sort((a, b) => a.name.localeCompare(b.name));
          setProducts(data);
          setError(null);
          return;
        }
      } catch (err) {
        console.error('Customer catalog endpoint failed:', err);
      }

      // Final fallback to generic products endpoint
      const fbParams = new URLSearchParams({ isActive: 'true', limit: '20', _t: ts });
      if (selectedCategory !== 'All') fbParams.set('category', selectedCategory);
      const fbRes = await fetch(`${API}/api/products?${fbParams}`,
        { headers: { 'Cache-Control': 'no-cache', ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
      );
      const fbResult = await fbRes.json();
      if (!fbResult.success) throw new Error(fbResult.message);
      let data = fbResult.data || [];
      if (sortBy === 'newest') data = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      else if (sortBy === 'price-low') data = [...data].sort((a, b) => parseFloat(a.baseSellingPrice) - parseFloat(b.baseSellingPrice));
      else if (sortBy === 'price-high') data = [...data].sort((a, b) => parseFloat(b.baseSellingPrice) - parseFloat(a.baseSellingPrice));
      else if (sortBy === 'name') data = [...data].sort((a, b) => a.name.localeCompare(b.name));
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, sortBy, showToast]);

  const effectiveSearch = committedSearch || debouncedSearchQuery;

  useEffect(() => {
    fetchProducts({ query: effectiveSearch });
  }, [effectiveSearch, fetchProducts]);

  const featuredProduct = useMemo(() => {
    return products.find(p => p.totalStock > 0) || products[0];
  }, [products]);

  const clearActiveSearch = () => {
    setActiveSearch('');
    setSearchQuery('');
    clearSearch();
  };

  // ── Cart ──────────────────────────────────────────────────────────────────
  const handleAddToCart = useCallback(async (product) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Please login to add items to cart', 'warning');
        setTimeout(() => { window.location.href = '/'; }, 1500);
        return;
      }
      const response = await fetch(`${API}/api/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, quantity: 1 })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      showToast(`${product.name} added to cart! 🛒`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [showToast]);

  // ── Wishlist ──────────────────────────────────────────────────────────────
  const handleToggleWishlist = useCallback(async (product) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Please login to add items to wishlist', 'warning');
        setTimeout(() => { window.location.href = '/'; }, 1500);
        return;
      }
      const isWishlisted = wishlistIds.has(product.id);
      if (isWishlisted) {
        const res = await fetch(`${API}/api/wishlist/${product.id}`, {
          method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.message);
        setWishlistIds(prev => { const s = new Set(prev); s.delete(product.id); return s; });
        showToast(`${product.name} removed from wishlist 💔`, 'info');
      } else {
        const res = await fetch(`${API}/api/wishlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ productId: product.id })
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.message);
        setWishlistIds(prev => new Set([...prev, product.id]));
        showToast(`${product.name} added to wishlist! ❤️`, 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [showToast, wishlistIds]);

  // ── View product ──────────────────────────────────────────────────────────
  const handleViewProduct = useCallback((product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
    trackInteraction(product.id, 'VIEW');
  }, []);

  // ── Buy Now ───────────────────────────────────────────────────────────────
  const handleBuyNow = useCallback((product) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setBuyNowForm({
        recipientName: user?.name || '', recipientPhone: user?.phone || '',
        addressLine1: user?.addressLine1 || '', addressLine2: user?.addressLine2 || '',
        city: user?.city || '', state: user?.state || '',
        postalCode: user?.postalCode || '', country: user?.country || '', note: ''
      });
    } catch (err) {
      console.error('Failed to prefill buy-now form from user:', err);
    }
    setBuyNowProduct(product);
    setBuyNowQty(1);
    setShowDetailModal(false);
    setSelectedProduct(null);
  }, []);

  const handleBuyNowSubmit = async () => {
    if (!buyNowProduct) return;
    setBuyNowLoading(true);
    try {
      const token = localStorage.getItem('token');
      const cartRes = await fetch(`${API}/api/cart`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: buyNowProduct.id, quantity: buyNowQty })
      });
      const cartResult = await cartRes.json();
      if (!cartResult.success) throw new Error(cartResult.message);

      const orderRes = await fetch(`${API}/api/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(buyNowForm)
      });
      const orderResult = await orderRes.json();
      if (!orderResult.success) throw new Error(orderResult.message);

      const confirmRes = await fetch(`${API}/api/orders/${orderResult.data.id}/confirm`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      });
      const confirmResult = await confirmRes.json();
      if (!confirmResult.success) throw new Error(confirmResult.message);

      showToast(`Order #${orderResult.data.id} placed & confirmed!`, 'success');
      window.dispatchEvent(new CustomEvent('orderCreated', { detail: { orderId: orderResult.data.id } }));
      setBuyNowProduct(null);
    } catch (err) {
      showToast(err.message || 'Order failed', 'error');
    } finally {
      setBuyNowLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="shop-page">
        <div className="card">
          <div className="loading-container">
            <Loader className="spin" size={44} />
            <p>Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shop-page">
        <div className="card">
          <div className="error-container">
            <h3>Error Loading Products</h3>
            <p>{error}</p>
            <button className="btn primary" onClick={() => fetchProducts()}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-page">
      <div className="floating-emoji emoji-float">🎈</div>

      <Hero
        featured={featuredProduct}
        searchActive={!!activeSearch || !!topbarQuery}
        onShopNow={() => window.scrollTo({ top: 400, behavior: 'smooth' })}
        onExploreCategories={() => {
          setSelectedCategory('All');
          const el = document.getElementById('categories');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
          else window.scrollTo({ top: 400, behavior: 'smooth' });
        }}
      />

      <div className="card">

        {/* Personalised banner */}
        {isPersonalised && !activeSearch && (
          <div className="personalised-banner">
            <Sparkles size={13} />
            Picked for you based on your browsing &amp; purchase history
          </div>
        )}

        {/* Active search banner */}
        {activeSearch && (
          <div className="active-search-banner">
            <Search size={14} />
            Results for <strong className="active-search-term">"{activeSearch}"</strong>
            &nbsp;— {products.length} match{products.length !== 1 ? 'es' : ''}
            <button className="active-search-clear" onClick={clearActiveSearch}>
              <X size={12} /> Clear
            </button>
          </div>
        )}

        <div className="shop-toolbar" id="categories">
          <CategoryStrip
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
          <div className="search-and-sort">
            <div className="search-wrap">
              <input
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="no-products">
            <h3>No products found</h3>
            <p>
              {activeSearch
                ? `No matches for "${activeSearch}"`
                : 'Try adjusting your search or filters'}
            </p>
            {activeSearch && (
              <button className="btn primary mt-16" onClick={clearActiveSearch}>
                Show all products
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="products-count">
              {sidebarSubCategory
                ? `Showing ${products.filter(p => p.subCategory === sidebarSubCategory).length} products in "${sidebarSubCategory}"`
                : isPersonalised && !activeSearch
                  ? `${products.length} personalised picks for you`
                  : `Showing ${products.length} ${products.length === 1 ? 'product' : 'products'}${activeSearch ? ` for "${activeSearch}"` : ''}`
              }
            </div>
            {/* §2.4: SubCategory filter badge */}
            {sidebarSubCategory && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 12, background: 'var(--accent-soft, rgba(192,113,79,0.12))', color: 'var(--terra, #C0714F)', border: '1px solid rgba(192,113,79,0.3)', borderRadius: 20, padding: '3px 12px', fontWeight: 600 }}>
                  {sidebarSubCategory}
                </span>
              </div>
            )}
            <ProductGrid
              products={sidebarSubCategory
                ? products.filter(p => p.subCategory === sidebarSubCategory)
                : products}
              onAddToCart={handleAddToCart}
              onToggleWishlist={handleToggleWishlist}
              onViewProduct={handleViewProduct}
              onBuyNow={handleBuyNow}
              wishlistIds={wishlistIds}
            />
          </>
        )}
      </div>

      {/* Product Detail Modal */}
      {showDetailModal && selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isWishlisted={wishlistIds.has(selectedProduct.id)}
          onClose={() => setShowDetailModal(false)}
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleToggleWishlist}
          onBuyNow={handleBuyNow}
        />
      )}

      {/* Buy Now Modal */}
      {buyNowProduct && (
        <div
          className="modal-overlay"
          onClick={() => !buyNowLoading && setBuyNowProduct(null)}
        >
          <div className="modal-content" onClick={e => e.stopPropagation()}>

            <div className="modal-header">
              <span className="emoji-large">🛍️</span>
              <div>
                <h3>Buy Now</h3>
                <p>{buyNowProduct.name}</p>
              </div>
              <button
                onClick={() => setBuyNowProduct(null)}
                className="modal-close-btn"
              >
                ×
              </button>
            </div>

            <div className="buy-now-info">
              <div className="name">{buyNowProduct.name}</div>
              <div className="price">
                ₹{parseFloat(buyNowProduct.baseSellingPrice).toFixed(2)} each
              </div>
              <div className="qty-controls">
                <span className="qty-label">Qty:</span>
                <button
                  onClick={() => setBuyNowQty(q => Math.max(1, q - 1))}
                  className="qty-btn"
                >
                  −
                </button>
                <span className="qty-display">{buyNowQty}</span>
                <button
                  onClick={() => setBuyNowQty(q => Math.min(buyNowProduct.totalStock, q + 1))}
                  className="qty-btn"
                >
                  +
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <span className="text-muted">Total: </span>
              <strong className="text-danger">
                ₹{(parseFloat(buyNowProduct.baseSellingPrice) * buyNowQty).toFixed(2)}
              </strong>
            </div>

            <h4 className="modal-section-title">Delivery Details</h4>

            <div className="form-grid">
              {[
                ['Recipient Name *', 'recipientName', 'text'],
                ['Phone', 'recipientPhone', 'tel'],
                ['Address Line 1', 'addressLine1', 'text'],
                ['Address Line 2', 'addressLine2', 'text'],
                ['City', 'city', 'text'],
                ['State', 'state', 'text'],
                ['Postal Code', 'postalCode', 'text'],
                ['Country', 'country', 'text'],
              ].map(([label, field, type]) => (
                <div
                  key={field}
                  className={['addressLine1', 'addressLine2'].includes(field) ? 'span-2' : ''}
                >
                  <label className="form-label">{label}</label>
                  <input
                    type={type}
                    value={buyNowForm[field]}
                    onChange={e => setBuyNowForm(f => ({ ...f, [field]: e.target.value }))}
                    className="form-input"
                  />
                </div>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Note</label>
              <textarea
                rows={2}
                value={buyNowForm.note}
                onChange={e => setBuyNowForm(f => ({ ...f, note: e.target.value }))}
                className="form-textarea"
              />
            </div>

            <div className="form-actions">
              <button
                onClick={() => setBuyNowProduct(null)}
                disabled={buyNowLoading}
                className="btn outline"
              >
                Cancel
              </button>
              <button
                onClick={handleBuyNowSubmit}
                disabled={buyNowLoading || !buyNowForm.recipientName}
                className="btn primary buy-now-submit"
              >
                {buyNowLoading ? 'Placing...' : '🛍️ Place Order'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
