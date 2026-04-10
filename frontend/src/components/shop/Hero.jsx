import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Sparkles, Grid3X3 } from 'lucide-react';
import { API_BASE_URL } from '../../config/constants';

/**
 * Hero — §9.1
 * - Hides smoothly when `searchActive` is true, reappears when cleared.
 * - "Explore Categories" CTA calls `onExploreCategories` (new prop).
 * - All transitions use CSS so there is zero layout flash.
 */
export default function Hero({ featured, onShopNow, onExploreCategories, searchActive = false }) {
  const [imageError, setImageError] = useState(false);
  const heroRef = useRef(null);

  const getImageUrl = () => {
    const primaryImage =
      featured?.images?.find(img => img.isPrimary)?.url ||
      featured?.images?.[0]?.url;

    if (!primaryImage) return '/placeholder.png';
    if (primaryImage.startsWith('http://') || primaryImage.startsWith('https://')) return primaryImage;
    return `${API_BASE_URL}${primaryImage}`;
  };

  const imageUrl = getImageUrl();

  // Smooth height collapse when search is active (§9.1)
  const heroStyle = {
    maxHeight: searchActive ? '0' : '600px',
    opacity: searchActive ? '0' : '1',
    overflow: 'hidden',
    marginBottom: searchActive ? '0' : undefined,
    paddingTop: searchActive ? '0' : undefined,
    paddingBottom: searchActive ? '0' : undefined,
    transition:
      'max-height 0.40s cubic-bezier(0.4, 0, 0.2, 1), ' +
      'opacity 0.30s ease, ' +
      'margin-bottom 0.40s ease, ' +
      'padding 0.40s ease',
    pointerEvents: searchActive ? 'none' : undefined,
  };

  return (
    <section className="shop-hero" style={heroStyle} ref={heroRef} aria-hidden={searchActive}>
      <div className="hero-left">
        <div className="hero-badge">
          <Sparkles size={16} />
          <span>New Arrivals</span>
        </div>
        <h1>Discover Stationery Delights</h1>
        <p className="hero-subtitle">
          Curated picks, trending products and limited offers — just for you.
        </p>
        <div className="hero-ctas">
          <button className="btn primary" onClick={onShopNow}>
            <ShoppingBag size={20} />
            Shop Now
          </button>
          {/* §9.1 / §2.4: Explore Categories wired to onExploreCategories */}
          <button
            className="btn outline"
            onClick={() => {
              if (onExploreCategories) {
                onExploreCategories();
              } else {
                const el = document.getElementById('categories');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            <Grid3X3 size={18} />
            Explore Categories
          </button>
        </div>
        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-number">500+</div>
            <div className="stat-label">Products</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">50+</div>
            <div className="stat-label">Brands</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">10k+</div>
            <div className="stat-label">Happy Customers</div>
          </div>
        </div>
      </div>
      <div className="hero-right">
        {featured && (
          <div className="hero-card">
            <div className="hero-card-badge">Featured</div>
            <img
              src={imageError ? '/placeholder.png' : imageUrl}
              alt={featured.name}
              onError={() => setImageError(true)}
            />
            <div className="hc-info">
              <div className="hc-category">{featured.category}</div>
              <div className="hc-name">{featured.name}</div>
              <div className="hc-price-row">
                <div className="hc-price">₹{parseFloat(featured.baseSellingPrice).toFixed(2)}</div>
                {featured.totalStock > 0 ? (
                  <div className="hc-stock in">In Stock</div>
                ) : (
                  <div className="hc-stock out">Out of Stock</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
