import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Heart, ShoppingCart, Package,
  Minus, Plus, Zap, Bell, Tag, CheckCircle2,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import BargainModal from './BargainModal';
import './ProductDetailModal.css';
import { API_BASE_URL } from '../../config/constants';

const VARIANT_LABEL = { COLOR: 'Color', SIZE: 'Size', TYPE: 'Type', STYLE: 'Style' };

export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  onToggleWishlist,
  onBuyNow,
  isWishlisted = false,
}) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity]           = useState(1);
  const [notifying, setNotifying]         = useState(false);
  const [notified, setNotified]           = useState(false);
  const [addedFlash, setAddedFlash]       = useState(false);
  const [imgLoaded, setImgLoaded]         = useState(false);

  // Variant switcher
  const [activeProduct, setActiveProduct] = useState(product);

  // Bargain state
  const [showBargainModal, setShowBargainModal]       = useState(false);
  const [eligibility, setEligibility]                 = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  // Touch swipe for image gallery
  const touchStartX = useRef(null);

  /* ── helpers ── */
  const getImageUrl = (url) => {
    if (!url) return '/placeholder.png';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE_URL}${url}`;
  };

  // Reset on variant switch
  useEffect(() => {
    setSelectedImage(0);
    setImgLoaded(false);
    setQuantity(1);
  }, [activeProduct.id]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const images        = activeProduct.images || [];
  const currentImgUrl = images[selectedImage]?.url
    ? getImageUrl(images[selectedImage].url)
    : '/placeholder.png';

  const isOutOfStock = activeProduct.totalStock === 0;
  const maxQuantity  = Math.min(activeProduct.totalStock, 10);

  // Variant group
  const variantGroup  = product.variantGroup;
  const siblings      = variantGroup?.products ?? [];
  const hasVariants   = siblings.length > 1;
  const variantType   = variantGroup?.variantType ?? null;

  // MRP display
  const sp  = parseFloat(activeProduct.baseSellingPrice || 0);
  const mrp = parseFloat(activeProduct.mrp || 0);
  const hasMrp = mrp > 0 && mrp > sp;
  const discount = hasMrp ? Math.round(((mrp - sp) / mrp) * 100) : 0;

  /* ── Bargain eligibility ── */
  useEffect(() => {
    if (activeProduct.bargainable && !isOutOfStock) checkBargainEligibility();
  }, [activeProduct.id, activeProduct.bargainable]);

  const checkBargainEligibility = async () => {
    setCheckingEligibility(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res    = await fetch(`${API_BASE_URL}/api/bargain/eligibility/${activeProduct.id}`, { headers });
      const result = await res.json();
      if (result.success) setEligibility(result.data);
    } catch (e) {
      console.error('Eligibility check failed:', e);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleBargainSuccess = (data) => {
    alert(`Offer accepted at ₹${data.finalPrice}! Item added to cart.`);
    checkBargainEligibility();
    onClose();
  };

  /* ── Cart ── */
  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) onAddToCart(activeProduct);
    setAddedFlash(true);
    setTimeout(() => { setAddedFlash(false); onClose(); }, 800);
  };

  const handleQuantityChange = (delta) => {
    const n = quantity + delta;
    if (n >= 1 && n <= maxQuantity) setQuantity(n);
  };

  /* ── Image navigation ── */
  const prevImage = () => setSelectedImage(i => (i - 1 + images.length) % images.length);
  const nextImage = () => setSelectedImage(i => (i + 1) % images.length);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? nextImage() : prevImage();
    touchStartX.current = null;
  };

  /* ── Notify ── */
  const handleNotifyMe = async () => {
    setNotifying(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { alert('Please login to get notified'); return; }
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const res  = await fetch(`${API_BASE_URL}/api/products/${activeProduct.id}/notify-me`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email: user.email }),
      });
      const result = await res.json();
      if (result.success) setNotified(true);
      else alert(result.message || 'Failed to register notification');
    } catch (err) {
      alert('Failed to register notification');
    } finally {
      setNotifying(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={activeProduct.name}>
        <div className="product-detail-modal" onClick={(e) => e.stopPropagation()}>

          {/* ── Close ── */}
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2.5} />
          </button>

          <div className="modal-content">

            {/* ══════════════════════════════════════
                LEFT — Image Gallery
            ══════════════════════════════════════ */}
            <div className="modal-left">

              {/* Main image with swipe support */}
              <div
                className="main-image"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                {!imgLoaded && <div className="img-skeleton" />}
                <img
                  src={currentImgUrl}
                  alt={activeProduct.name}
                  className={imgLoaded ? 'loaded' : ''}
                  onLoad={() => setImgLoaded(true)}
                  onError={(e) => { e.target.src = '/placeholder.png'; setImgLoaded(true); }}
                />

                {isOutOfStock && (
                  <div className="modal-stock-badge">Out of Stock</div>
                )}

                {/* Discount badge */}
                {hasMrp && !isOutOfStock && (
                  <div className="modal-discount-badge">{discount}% OFF</div>
                )}

                {/* Arrow nav — only when multiple images */}
                {images.length > 1 && (
                  <>
                    <button className="img-arrow img-arrow--left"  onClick={prevImage} aria-label="Previous image"><ChevronLeft  size={18} /></button>
                    <button className="img-arrow img-arrow--right" onClick={nextImage} aria-label="Next image"><ChevronRight size={18} /></button>
                    <div className="img-dots">
                      {images.map((_, idx) => (
                        <span
                          key={idx}
                          className={`img-dot ${idx === selectedImage ? 'active' : ''}`}
                          onClick={() => setSelectedImage(idx)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="image-thumbnails">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`thumbnail ${idx === selectedImage ? 'active' : ''}`}
                      onClick={() => { setSelectedImage(idx); setImgLoaded(false); }}
                    >
                      <img
                        src={getImageUrl(img.url)}
                        alt={`${activeProduct.name} view ${idx + 1}`}
                        onError={(e) => (e.target.src = '/placeholder.png')}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Seller card — in left panel on PC, keeps right panel clean */}
              {activeProduct.createdBy && (
                <div className="seller-card">
                  <div className="seller-avatar-wrap">
                    {activeProduct.createdBy.photoUrl
                      ? <img src={activeProduct.createdBy.photoUrl} alt={activeProduct.createdBy.name} className="seller-photo" />
                      : <span className="seller-avatar-icon">👤</span>
                    }
                  </div>
                  <div className="seller-card-text">
                    <span className="seller-card-name">{activeProduct.createdBy.name}</span>
                    <span className={`seller-role-badge ${activeProduct.createdBy.role === 'ADMIN' ? 'admin' : 'seller'}`}>
                      {activeProduct.createdBy.role}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ══════════════════════════════════════
                RIGHT — Product Details
                ORDER (per UpgradeDoc Section 2.6):
                1. Category pill
                2. Name
                3. Price + MRP + Stock
                4. Variant chips (if any)
                5. Quantity selector
                6. Add to Cart + Wishlist  ← ABOVE description
                7. Buy Now
                8. Bargain (if eligible)
                9. Description
                10. Meta (SKU, category, sub-cat)
            ══════════════════════════════════════ */}
            <div className="modal-right">

              {/* 1 — Category pill */}
              <div className="modal-category">
                <Tag size={11} />
                {activeProduct.category}
                {activeProduct.subCategory && (
                  <span className="sub-cat-sep">·</span>
                )}
                {activeProduct.subCategory && (
                  <span className="sub-cat-label">{activeProduct.subCategory}</span>
                )}
              </div>

              {/* 2 — Name */}
              <h2 className="modal-title">{activeProduct.name}</h2>

              {/* 3 — Price + MRP + Stock */}
              <div className="modal-price-section">
                <div className="price-group">
                  <div className="modal-price">₹{sp.toFixed(2)}</div>
                  {hasMrp && (
                    <div className="modal-mrp">
                      <span className="mrp-label">MRP</span>
                      <span className="mrp-value">₹{mrp.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className={`modal-stock ${isOutOfStock ? 'out' : 'in'}`}>
                  <Package size={13} />
                  {isOutOfStock ? 'Out of Stock' : `${activeProduct.totalStock} in stock`}
                </div>
              </div>

              {/* 4 — Variant Switcher */}
              {hasVariants && (
                <div className="variant-section">
                  <div className="variant-label">
                    {VARIANT_LABEL[variantType] || 'Variant'}
                  </div>
                  <div className="variant-chips">
                    {siblings.map((sib) => {
                      const isActive = sib.id === activeProduct.id;
                      const sibImg   = sib.images?.find(i => i.isPrimary)?.url || sib.images?.[0]?.url;
                      return (
                        <button
                          key={sib.id}
                          onClick={() => { setActiveProduct(sib); setEligibility(null); }}
                          title={sib.name}
                          className={`variant-chip ${isActive ? 'active' : ''} ${sib.totalStock === 0 ? 'oos' : ''}`}
                        >
                          {sibImg && (
                            <img
                              src={sibImg.startsWith('http') ? sibImg : `${API_BASE_URL}${sibImg}`}
                              alt={sib.name}
                              className="variant-chip-img"
                              onError={e => e.target.style.display = 'none'}
                            />
                          )}
                          <span className="variant-chip-name">{sib.name}</span>
                          {sib.totalStock === 0 && <span className="variant-oos">OOS</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5 — Quantity selector (only if in stock) */}
              {!isOutOfStock && (
                <div className="quantity-selector">
                  <span className="qty-label">Qty</span>
                  <div className="quantity-controls">
                    <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1} aria-label="Decrease">
                      <Minus size={14} />
                    </button>
                    <span className="quantity-value">{quantity}</span>
                    <button onClick={() => handleQuantityChange(1)} disabled={quantity >= maxQuantity} aria-label="Increase">
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="max-qty">Max {maxQuantity}</span>
                </div>
              )}

              {/* 6 — Add to Cart + Wishlist (ABOVE description per spec) */}
              <div className="modal-actions-primary">
                {isOutOfStock ? (
                  <button
                    className={`btn-modal-notify ${notified ? 'notified' : 'default'}`}
                    onClick={handleNotifyMe}
                    disabled={notifying || notified}
                  >
                    {notified ? (
                      <><CheckCircle2 size={16} /> You'll be notified</>
                    ) : notifying ? (
                      <>Registering…</>
                    ) : (
                      <><Bell size={16} /> Notify Me</>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      className={`btn-modal-cart${addedFlash ? ' success' : ''}`}
                      onClick={handleAddToCart}
                      disabled={addedFlash}
                    >
                      {addedFlash
                        ? <><CheckCircle2 size={17} /> Added!</>
                        : <><ShoppingCart size={17} /> Add to Cart</>
                      }
                    </button>
                    <button
                      className={`btn-modal-wishlist ${isWishlisted ? 'wishlisted' : ''}`}
                      onClick={() => { onToggleWishlist?.(activeProduct); onClose(); }}
                    >
                      <Heart size={17} fill={isWishlisted ? 'currentColor' : 'none'} />
                    </button>
                  </>
                )}
              </div>

              {/* 7 — Buy Now */}
              {!isOutOfStock && onBuyNow && (
                <button className="btn-modal-buynow" onClick={() => onBuyNow(activeProduct)}>
                  <Zap size={16} />
                  Buy Now
                </button>
              )}

              {/* 8 — Bargain */}
              {!isOutOfStock && activeProduct.bargainable && !checkingEligibility && eligibility?.canBargain && (
                <button className="btn-modal-bargain" onClick={() => setShowBargainModal(true)}>
                  💰 Make an Offer
                  {eligibility.metadata?.remainingAttempts > 0 && (
                    <span className="attempts-badge">{eligibility.metadata.remainingAttempts} left</span>
                  )}
                </button>
              )}

              {/* 9 — Description */}
              {activeProduct.description && (
                <div className="modal-description">
                  <h4>Description</h4>
                  <p>{activeProduct.description}</p>
                </div>
              )}

              {/* 10 — Meta */}
              <div className="product-meta-info">
                <div className="meta-row">
                  <span className="meta-key">SKU</span>
                  <span className="meta-val">{activeProduct.uid || activeProduct.id}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-key">Category</span>
                  <span className="meta-val">{activeProduct.category}</span>
                </div>
                {activeProduct.subCategory && (
                  <div className="meta-row">
                    <span className="meta-key">Sub-category</span>
                    <span className="meta-val">{activeProduct.subCategory}</span>
                  </div>
                )}
                <div className="meta-row">
                  <span className="meta-key">Status</span>
                  <span className={`meta-status ${isOutOfStock ? 'out' : 'in'}`}>
                    {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

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
    </>
  );
}
