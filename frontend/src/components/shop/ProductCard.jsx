import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Eye, Zap, Bell, CheckCircle2 } from 'lucide-react';
import BargainModal from './BargainModal';
import './ProductCard.css';
import { API_BASE_URL } from '../../config/constants';

// ── Variant type → pill label map ────────────────────────────────────────────
const VARIANT_LABEL = { COLOR: 'color', SIZE: 'size', TYPE: 'type', STYLE: 'style' };

export default function ProductCard({
  product,
  variant = 'standard',
  onAddToCart,
  onToggleWishlist,
  onViewProduct,
  onBuyNow,
  isWishlisted = false,
}) {
  const safeProduct = product || {};

  const [imageError, setImageError]                       = useState(false);
  const [notifying, setNotifying]                         = useState(false);
  const [notified, setNotified]                           = useState(false);
  const [cartFlash, setCartFlash]                         = useState(false);

  // Variant switcher — tracks which sibling product is "active" in this card
  const [activeVariantId, setActiveVariantId]             = useState(safeProduct.id);
  const [activeProduct, setActiveProduct]                 = useState(safeProduct);

  // Bargain state
  const [showBargainModal, setShowBargainModal]           = useState(false);
  const [eligibility, setEligibility]                     = useState(null);
  const [checkingEligibility, setCheckingEligibility]     = useState(false);

  // Reset active variant when the parent product changes
  useEffect(() => {
    if (!product) return;
    setActiveVariantId(product.id);
    setActiveProduct(product);
  }, [product]);

  /* ── Variant siblings ── */
  const variantGroup = safeProduct.variantGroup;
  const siblings     = variantGroup?.products ?? [];
  const hasVariants  = siblings.length > 1;
  const variantType  = variantGroup?.variantType ?? null;

  const handleVariantSwitch = (sibling) => {
    if (sibling.id === activeVariantId) return;
    setActiveVariantId(sibling.id);
    setActiveProduct(sibling);
    setImageError(false);
  };

  /* ── Image URL — resolves from the currently active variant ── */
  const getImageUrl = (p = activeProduct) => {
    const primary = p.images?.find((img) => img.isPrimary)?.url
                 || p.images?.[0]?.url;
    if (!primary) return '/placeholder.png';
    if (primary.startsWith('http://') || primary.startsWith('https://')) return primary;
    return `${API_BASE_URL}${primary}`;
  };

  const imageUrl     = getImageUrl();
  const isOutOfStock = activeProduct.totalStock === 0;
  const isLowStock   = activeProduct.totalStock > 0 && activeProduct.totalStock <= (activeProduct.lowStockThreshold || 10);

  /* ── Bargain eligibility ── */
  useEffect(() => {
      if (activeProduct?.bargainable && !isOutOfStock) checkBargainEligibility();
  }, [activeProduct?.id, activeProduct?.bargainable]);

  const checkBargainEligibility = async () => {
    setCheckingEligibility(true);
    try {
      const token   = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res    = await fetch(`${API_BASE_URL}/api/bargain/eligibility/${activeProduct.id}`, { headers });
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
    onAddToCart(activeProduct);
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
      const res  = await fetch(`${API_BASE_URL}/api/products/${activeProduct.id}/notify`, {
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
      {!product ? null : (
      <div className={`product-card ${variant} ${isOutOfStock ? 'out-of-stock' : ''}`}>

        {/* ── Image ── */}
        <div className="pc-image" onClick={() => onViewProduct?.(activeProduct)}>

          {/* Stock badge */}
          {isOutOfStock
            ? <div className="stock-badge out">Out of Stock</div>
            : isLowStock && <div className="stock-badge low">Only {activeProduct.totalStock} left</div>
          }

          <img
            src={imageError ? '/placeholder.png' : imageUrl}
            alt={activeProduct.name}
            onError={() => setImageError(true)}
            loading="lazy"
          />

          {/* Wishlist corner badge */}
          <button
            className={`pc-wishlist-corner ${isWishlisted ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggleWishlist?.(activeProduct); }}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            title={isWishlisted ? 'Wishlisted' : 'Add to wishlist'}
          >
            <Heart size={15} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>

          {/* Hover overlay */}
          <div className="pc-overlay">
            <button
              className="pc-icon view"
              onClick={(e) => { e.stopPropagation(); onViewProduct?.(activeProduct); }}
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
          <div className="pc-category">{activeProduct.category}</div>

          <div
            className="pc-title"
            title={activeProduct.name}
            onClick={() => onViewProduct?.(activeProduct)}
            style={{ cursor: 'pointer' }}
          >
            {activeProduct.name}
          </div>

          <p className="pc-description">
            {activeProduct.description?.substring(0, 72)}
            {activeProduct.description?.length > 72 ? '…' : ''}
          </p>

          {/* ── Variant switcher ── */}
          {hasVariants && (
            <div className="pc-variants" title={`Switch ${VARIANT_LABEL[variantType] || 'variant'}`}>
              <span className="pc-variant-label">{VARIANT_LABEL[variantType] || 'variant'}:</span>
              <div className="pc-variant-pills">
                {siblings.map((sib) => {
                  const sibImg = sib.images?.find(i => i.isPrimary)?.url || sib.images?.[0]?.url;
                  const isActive = sib.id === activeVariantId;
                  return (
                    <button
                      key={sib.id}
                      className={`pc-variant-pill ${isActive ? 'active' : ''} ${sib.totalStock === 0 ? 'oos' : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleVariantSwitch(sib); }}
                      title={sib.name}
                    >
                      {sibImg ? (
                        <img
                          src={sibImg.startsWith('http') ? sibImg : `${API_BASE_URL}${sibImg}`}
                          alt={sib.name}
                          className="pc-variant-thumb"
                          onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }}
                        />
                      ) : null}
                      <span className="pc-variant-pill-name" style={sibImg ? { display:'none' } : {}}>
                        {sib.name.length > 10 ? sib.name.slice(0, 10) + '…' : sib.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Seller */}
          {activeProduct.createdBy && (
            <div className="seller-badge">
              👤 {activeProduct.createdBy.name}
            </div>
          )}

          {/* Admin-granted special offer badge */}
          {eligibility?.metadata?.grantedByAdmin && (
            <div className="offer-badge">🔑 Special Offer</div>
          )}

          {/* Price + MRP — §2.5: show MRP strikethrough unless MRP == SP */}
          <div className="pc-meta">
            <div className="pc-price">
              <span className="currency">₹</span>
              <span className="amount">{parseFloat(activeProduct.baseSellingPrice).toFixed(2)}</span>
              {activeProduct.mrp && parseFloat(activeProduct.mrp) > parseFloat(activeProduct.baseSellingPrice) && (
                <span className="pc-mrp">₹{parseFloat(activeProduct.mrp).toFixed(2)}</span>
              )}
            </div>
            {activeProduct.mrp && parseFloat(activeProduct.mrp) > parseFloat(activeProduct.baseSellingPrice) && (
              <span className="pc-discount-badge">
                {Math.round(((activeProduct.mrp - activeProduct.baseSellingPrice) / activeProduct.mrp) * 100)}% off
              </span>
            )}
          </div>

          {/* ✨ Bargain Button */}
          {!isOutOfStock && activeProduct.bargainable && (
            checkingEligibility ? (
              <button className="bargain-btn" disabled>Checking offer...</button>
            ) : eligibility?.canBargain ? (
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
            ) : null
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
                onClick={(e) => { e.stopPropagation(); onBuyNow(activeProduct); }}
              >
                <Zap size={13} />
                Buy Now
              </button>
            )
          )}
        </div>
      </div>
      )}

      {/* Bargain Modal */}
      {showBargainModal && eligibility && (
        <BargainModal
          isOpen={showBargainModal}
          onClose={() => setShowBargainModal(false)}
          product={activeProduct}
          eligibility={eligibility}
          onSuccess={handleBargainSuccess}
        />
      )}

      {/* Inline variant pill styles — scoped, no external CSS changes needed */}
      <style>{`
        .pc-variants{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:6px 0 4px;}
        .pc-variant-label{font-size:10px;color:#888;text-transform:capitalize;white-space:nowrap;}
        .pc-variant-pills{display:flex;gap:4px;flex-wrap:wrap;}
        .pc-variant-pill{width:28px;height:28px;border-radius:6px;border:2px solid #e5e7eb;background:#f9fafb;cursor:pointer;padding:0;overflow:hidden;position:relative;transition:border-color .15s,box-shadow .15s;display:flex;align-items:center;justify-content:center;}
        .pc-variant-pill:hover{border-color:#6366f1;}
        .pc-variant-pill.active{border-color:#6366f1;box-shadow:0 0 0 2px rgba(99,102,241,.25);}
        .pc-variant-pill.oos{opacity:.4;}
        .pc-variant-thumb{width:100%;height:100%;object-fit:cover;display:block;}
        .pc-variant-pill-name{font-size:8px;color:#374151;text-align:center;padding:0 2px;line-height:1.2;}
      `}</style>
    </>
  );
}
