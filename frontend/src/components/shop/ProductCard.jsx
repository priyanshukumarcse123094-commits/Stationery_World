import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Eye, Zap, Bell, CheckCircle2 } from 'lucide-react';
import BargainModal from './BargainModal';
import './ProductCard.css';
import { API_BASE_URL } from '../../config/constants';

export default function ProductCard({
  product,
  variant = 'standard',
  onAddToCart,
  onToggleWishlist,
  onViewProduct,
  onBuyNow,
  isWishlisted = false,
}) {
  if (!product) return null;

  const [imageError, setImageError]                       = useState(false);
  const [notifying, setNotifying]                         = useState(false);
  const [notified, setNotified]                           = useState(false);
  const [cartFlash, setCartFlash]                         = useState(false);

  // Bargain state
  const [showBargainModal, setShowBargainModal]           = useState(false);
  const [eligibility, setEligibility]                     = useState(null);
  const [checkingEligibility, setCheckingEligibility]     = useState(false);

  /* ── Image URL ── */
  const getImageUrl = () => {
    const primary = product.images?.find((img) => img.isPrimary)?.url
                 || product.images?.[0]?.url;
    if (!primary) return '/placeholder.png';
    if (primary.startsWith('http://') || primary.startsWith('https://')) return primary;
    return `${API_BASE_URL}${primary}`;
  };

  const imageUrl     = getImageUrl();
  const isOutOfStock = product.totalStock === 0;
  const isLowStock   = product.totalStock > 0 && product.totalStock <= (product.lowStockThreshold || 10);

  /* ── Bargain eligibility ── */
  useEffect(() => {
    if (product?.bargainable && !isOutOfStock) checkBargainEligibility();
  }, [product?.id, product?.bargainable]);

  const checkBargainEligibility = async () => {
    setCheckingEligibility(true);
    try {
      const token   = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res    = await fetch(`${API_BASE_URL}/api/bargain/eligibility/${product.id}`, { headers });
      const result = await res.json();
      if (result.success) setEligibility(result.data);
    } catch (err) {
      console.error('Eligibility check failed:', err);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleBargainSuccess = (data) => {
    alert(`Offer accepted at ₹${data.finalPrice}! Item added to cart.`);
    checkBargainEligibility();
  };

  /* ── Cart flash ── */
  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!onAddToCart) return;
    onAddToCart(product);
    setCartFlash(true);
    setTimeout(() => setCartFlash(false), 1000);
  };

  /* ── Notify ── */
  const handleNotifyMe = async (e) => {
    e.stopPropagation();
    setNotifying(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { alert('Please login to get notified'); return; }
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const res  = await fetch(`${API_BASE_URL}/api/products/${product.id}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: user.email }),
      });
      const result = await res.json();
      if (result.success) {
        setNotified(true);
        setTimeout(() => setNotified(false), 3000);
      } else {
        alert(result.message || 'Failed to register notification');
      }
    } catch (err) {
      console.error('Notify error:', err);
      alert('Failed to register notification');
    } finally {
      setNotifying(false);
    }
  };

  return (
    <>
      <div className={`product-card ${variant} ${isOutOfStock ? 'out-of-stock' : ''}`}>

        {/* ── Image ── */}
        <div className="pc-image" onClick={() => onViewProduct?.(product)}>

          {/* Stock badge */}
          {isOutOfStock
            ? <div className="stock-badge out">Out of Stock</div>
            : isLowStock && <div className="stock-badge low">Only {product.totalStock} left</div>
          }

          <img
            src={imageError ? '/placeholder.png' : imageUrl}
            alt={product.name}
            onError={() => setImageError(true)}
            loading="lazy"
          />

          {/* Wishlist corner badge — always visible when wishlisted, hover otherwise */}
          <button
            className={`pc-wishlist-corner ${isWishlisted ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggleWishlist?.(product); }}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            title={isWishlisted ? 'Wishlisted' : 'Add to wishlist'}
          >
            <Heart size={15} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>

          {/* Hover overlay — view + cart actions */}
          <div className="pc-overlay">
            <button
              className="pc-icon view"
              onClick={(e) => { e.stopPropagation(); onViewProduct?.(product); }}
              aria-label="Quick view"
              title="Quick view"
            >
              <Eye size={14} /> <span>View</span>
            </button>

            <button
              className="pc-icon cart"
              onClick={handleAddToCart}
              disabled={isOutOfStock || cartFlash}
              aria-label="Add to cart"
              title="Add to cart"
            >
              {cartFlash ? <CheckCircle2 size={14} /> : <ShoppingCart size={14} />}
              <span>{cartFlash ? 'Added' : 'Cart'}</span>
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="pc-body">
          <div className="pc-category">{product.category}</div>

          <div
            className="pc-title"
            title={product.name}
            onClick={() => onViewProduct?.(product)}
            style={{ cursor: 'pointer' }}
          >
            {product.name}
          </div>

          <p className="pc-description">
            {product.description?.substring(0, 72)}
            {product.description?.length > 72 ? '…' : ''}
          </p>

          {/* Seller */}
          {product.createdBy && (
            <div className="seller-badge">
              👤 {product.createdBy.name}
            </div>
          )}

          {/* Admin-granted special offer badge */}
          {eligibility?.metadata?.grantedByAdmin && (
            <div className="offer-badge">🔑 Special Offer</div>
          )}

          {/* Price */}
          <div className="pc-meta">
            <div className="pc-price">
              <span className="currency">₹</span>
              <span className="amount">{parseFloat(product.baseSellingPrice).toFixed(2)}</span>
            </div>
          </div>

          {/* ✨ Bargain Button */}
          {!isOutOfStock && product.bargainable && eligibility?.canBargain && (
            <button
              className="bargain-btn"
              onClick={(e) => { e.stopPropagation(); setShowBargainModal(true); }}
            >
              💰 Make an Offer
              {eligibility.metadata.remainingAttempts > 0 && (
                <span className="remaining">
                  {eligibility.metadata.remainingAttempts} left
                </span>
              )}
            </button>
          )}

          {/* Notify / Buy Now */}
          {isOutOfStock ? (
            <button
              className={`notify-btn ${notified ? 'notified' : 'default'}`}
              onClick={handleNotifyMe}
              disabled={notifying || notified}
            >
              {notified ? (
                <><CheckCircle2 size={13} /> Notified!</>
              ) : notifying ? (
                <>Registering…</>
              ) : (
                <><Bell size={13} /> Notify Me</>
              )}
            </button>
          ) : (
            !eligibility?.canBargain && onBuyNow && (
              <button
                className="buy-now-btn"
                onClick={(e) => { e.stopPropagation(); onBuyNow(product); }}
              >
                <Zap size={13} />
                Buy Now
              </button>
            )
          )}
        </div>
      </div>

      {/* Bargain Modal */}
      {showBargainModal && eligibility && (
        <BargainModal
          isOpen={showBargainModal}
          onClose={() => setShowBargainModal(false)}
          product={product}
          eligibility={eligibility}
          onSuccess={handleBargainSuccess}
        />
      )}
    </>
  );
}
