import React, { useState, useEffect } from 'react';
import {
  X, Heart, ShoppingCart, Package,
  Minus, Plus, Zap, Bell, Tag, CheckCircle2
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
  const [activeProduct, setActiveProduct] = useState(product);

  const [showBargainModal, setShowBargainModal]       = useState(false);
  const [eligibility, setEligibility]                 = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [bargainRequested, setBargainRequested]       = useState(false);
  const [requestingBargain, setRequestingBargain]     = useState(false);

  const getImageUrl = (url) => {
    if (!url) return '/placeholder.png';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE_URL}${url}`;
  };

  useEffect(() => { setSelectedImage(0); setQuantity(1); }, [activeProduct.id]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const images        = activeProduct.images || [];
  const currentImgUrl = images[selectedImage]?.url
    ? getImageUrl(images[selectedImage].url)
    : '/placeholder.png';

  const isOutOfStock = activeProduct.totalStock === 0;
  const maxQuantity  = Math.min(activeProduct.totalStock, 10);

  const variantGroup = product.variantGroup;
  const siblings     = variantGroup?.products ?? [];
  const hasVariants  = siblings.length > 1;
  const variantType  = variantGroup?.variantType ?? null;

  useEffect(() => {
    if (activeProduct.bargainable && !isOutOfStock) checkBargainEligibility();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch (e) { console.error('Eligibility check failed:', e); }
    finally { setCheckingEligibility(false); }
  };

  const handleBargainSuccess = (data) => {
    alert(`Offer accepted at ₹${data.finalPrice}! Item added to cart.`);
    checkBargainEligibility();
    onClose();
  };

  const handleRequestBargain = async () => {
    const token = localStorage.getItem('token');
    if (!token) { alert('Please login to request a bargain'); return; }
    setRequestingBargain(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/bargain/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: activeProduct.id }),
      });
      const result = await res.json();
      if (result.success) setBargainRequested(true);
      else alert(result.message || 'Could not submit bargain request');
    } catch { alert('Failed to send request. Please try again.'); }
    finally { setRequestingBargain(false); }
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) onAddToCart(activeProduct);
    setAddedFlash(true);
    setTimeout(() => { setAddedFlash(false); onClose(); }, 700);
  };

  const handleQuantityChange = (delta) => {
    const n = quantity + delta;
    if (n >= 1 && n <= maxQuantity) setQuantity(n);
  };

  const handleNotifyMe = async () => {
    setNotifying(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { alert('Please login to get notified'); return; }
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const res  = await fetch(`${API_BASE_URL}/api/products/${activeProduct.id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: user.email }),
      });
      const result = await res.json();
      if (result.success) setNotified(true);
      else alert(result.message || 'Failed to register notification');
    } catch { alert('Failed to register notification'); }
    finally { setNotifying(false); }
  };

  const hasMrpDiscount = activeProduct.mrp &&
    parseFloat(activeProduct.mrp) > parseFloat(activeProduct.baseSellingPrice);
  const discountPct = hasMrpDiscount
    ? Math.round(((activeProduct.mrp - activeProduct.baseSellingPrice) / activeProduct.mrp) * 100)
    : 0;

  return (
    <>
      <div
        className="modal-overlay"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={activeProduct.name}
      >
        <div className="product-detail-modal" onClick={(e) => e.stopPropagation()}>

          {/* ── Close ── */}
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2.5} />
          </button>

          <div className="modal-content">

            {/* ════════════════════════════════
                LEFT — Image Panel
            ════════════════════════════════ */}
            <div className="modal-left">
              {/* Main image */}
              <div className="main-image">
                <img
                  src={currentImgUrl}
                  alt={activeProduct.name}
                  onError={(e) => (e.target.src = '/placeholder.png')}
                />
                {isOutOfStock && (
                  <div className="modal-stock-badge">Out of Stock</div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="image-thumbnails">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`thumbnail ${idx === selectedImage ? 'active' : ''}`}
                      onClick={() => setSelectedImage(idx)}
                      role="button"
                      tabIndex={0}
                      aria-label={`View image ${idx + 1}`}
                    >
                      <img
                        src={getImageUrl(img.url)}
                        alt={`${activeProduct.name} ${idx + 1}`}
                        onError={(e) => (e.target.src = '/placeholder.png')}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Stock indicator — bottom of left panel */}
              <div className={`modal-stock-inline ${isOutOfStock ? 'out' : 'in'}`}>
                <Package size={13} />
                {isOutOfStock ? 'Out of Stock' : `${activeProduct.totalStock} in stock`}
              </div>
            </div>

            {/* ════════════════════════════════
                RIGHT — Details Panel
                Order per §2.6:
                1. Category pill
                2. Name
                3. Price / MRP
                4. Variant chips
                5. Quantity selector
                6. Add to Cart + Wishlist   ← BEFORE description
                7. Buy Now
                8. Bargain
                9. Description
                10. SKU / Meta / Seller
            ════════════════════════════════ */}
            <div className="modal-right">

              {/* 1 — Category */}
              <div className="modal-category">
                <Tag size={10} />
                {activeProduct.category}
                {activeProduct.subCategory && (
                  <span className="modal-subcategory"> · {activeProduct.subCategory}</span>
                )}
              </div>

              {/* 2 — Name */}
              <h2 className="modal-title">{activeProduct.name}</h2>

              {/* 3 — Price + MRP */}
              <div className="modal-price-row">
                <span className="modal-price">
                  ₹{parseFloat(activeProduct.baseSellingPrice).toFixed(2)}
                </span>
                {hasMrpDiscount && (
                  <>
                    <span className="modal-mrp">
                      MRP ₹{parseFloat(activeProduct.mrp).toFixed(2)}
                    </span>
                    <span className="modal-discount-badge">{discountPct}% off</span>
                  </>
                )}
              </div>

              {/* 4 — Variant chips */}
              {hasVariants && (
                <div className="modal-variants">
                  <div className="modal-variants-label">
                    {VARIANT_LABEL[variantType] || 'Variant'}
                  </div>
                  <div className="modal-variants-chips">
                    {siblings.map((sib) => {
                      const isActive = sib.id === activeProduct.id;
                      const sibImg   = sib.images?.find(i => i.isPrimary)?.url || sib.images?.[0]?.url;
                      return (
                        <button
                          key={sib.id}
                          className={`variant-chip${isActive ? ' active' : ''}${sib.totalStock === 0 ? ' oos' : ''}`}
                          onClick={() => { setActiveProduct(sib); setEligibility(null); }}
                          title={sib.name}
                        >
                          {sibImg && (
                            <img
                              src={sibImg.startsWith('http') ? sibImg : `${API_BASE_URL}${sibImg}`}
                              alt={sib.name}
                              onError={e => e.target.style.display = 'none'}
                            />
                          )}
                          <span>{sib.name}</span>
                          {sib.totalStock === 0 && <span className="chip-oos">OOS</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5 — Quantity */}
              {!isOutOfStock && (
                <div className="modal-qty-row">
                  <span className="modal-qty-label">Qty</span>
                  <div className="quantity-controls">
                    <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1} aria-label="Decrease">
                      <Minus size={13} />
                    </button>
                    <span className="quantity-value">{quantity}</span>
                    <button onClick={() => handleQuantityChange(1)} disabled={quantity >= maxQuantity} aria-label="Increase">
                      <Plus size={13} />
                    </button>
                  </div>
                  <span className="modal-qty-max">max {maxQuantity}</span>
                </div>
              )}

              {/* 6 — Add to Cart + Wishlist (or Notify if OOS) */}
              <div className="modal-actions">
                {isOutOfStock ? (
                  <button
                    className={`btn-modal-notify ${notified ? 'notified' : 'default'}`}
                    onClick={handleNotifyMe}
                    disabled={notifying || notified}
                  >
                    {notified ? <><CheckCircle2 size={16} /> Notified!</> :
                     notifying ? <>Registering…</> :
                     <><Bell size={16} /> Notify Me</>}
                  </button>
                ) : (
                  <>
                    <button
                      className={`btn-modal-cart${addedFlash ? ' success' : ''}`}
                      onClick={handleAddToCart}
                      disabled={addedFlash}
                    >
                      {addedFlash
                        ? <><CheckCircle2 size={16} /> Added!</>
                        : <><ShoppingCart size={16} /> Add to Cart</>}
                    </button>
                    <button
                      className={`btn-modal-wishlist${isWishlisted ? ' wishlisted' : ''}`}
                      onClick={() => { onToggleWishlist?.(activeProduct); onClose(); }}
                      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
                    </button>
                  </>
                )}
              </div>

              {/* 7 — Buy Now */}
              {!isOutOfStock && onBuyNow && (
                <button className="btn-modal-buynow" onClick={() => onBuyNow(activeProduct)}>
                  <Zap size={15} /> Buy Now
                </button>
              )}

              {/* 8 — Bargain */}
              {!isOutOfStock && activeProduct.bargainable && (
                checkingEligibility ? (
                  <button className="btn-modal-bargain" disabled>Checking eligibility…</button>
                ) : eligibility?.canBargain ? (
                  <button className="btn-modal-bargain" onClick={() => setShowBargainModal(true)}>
                    💰 Make an Offer
                    {eligibility.metadata?.remainingAttempts > 0 && (
                      <span className="attempts-badge">{eligibility.metadata.remainingAttempts} left</span>
                    )}
                  </button>
                ) : bargainRequested ? (
                  <button className="btn-modal-bargain" disabled>✅ Request sent</button>
                ) : (
                  <button
                    className="btn-modal-bargain btn-modal-bargain--outline"
                    onClick={handleRequestBargain}
                    disabled={requestingBargain}
                  >
                    {requestingBargain ? '⏳ Sending…' : '🤝 Request Bargain'}
                  </button>
                )
              )}

              {/* 9 — Description */}
              <div className="modal-description">
                <div className="modal-description-label">Description</div>
                <p>{activeProduct.description || 'No description available.'}</p>
              </div>

              {/* 10 — Meta + Seller */}
              <div className="product-meta-info">
                {activeProduct.id && (
                  <div className="meta-item"><strong>SKU</strong>{activeProduct.id}</div>
                )}
                {activeProduct.subCategory && (
                  <div className="meta-item"><strong>Sub-category</strong>{activeProduct.subCategory}</div>
                )}
                <div className="meta-item">
                  <strong>Status</strong>
                  <span style={{ color: isOutOfStock ? 'var(--m-red)' : 'var(--m-green)', fontWeight: 600 }}>
                    {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                  </span>
                </div>

                {activeProduct.createdBy && (
                  <div className="seller-info-block">
                    <div className="seller-avatar">👤</div>
                    <div className="seller-info-text">
                      <span className="seller-name">{activeProduct.createdBy.name}</span>
                      <span className={`seller-role-badge ${activeProduct.createdBy.role === 'ADMIN' ? 'admin' : 'seller'}`}>
                        {activeProduct.createdBy.role}
                      </span>
                    </div>
                  </div>
                )}
              </div>

            </div>{/* end modal-right */}
          </div>{/* end modal-content */}
        </div>{/* end product-detail-modal */}
      </div>

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
