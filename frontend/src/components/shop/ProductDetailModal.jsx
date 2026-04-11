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
  const [activeProduct, setActiveProduct] = useState(product);

  const [showBargainModal, setShowBargainModal]   = useState(false);
  const [eligibility, setEligibility]             = useState(null);
  const [checkingEligibility, setCheckingElig]    = useState(false);
  const [bargainRequested, setBargainRequested]   = useState(false);
  const [requestingBargain, setRequestingBargain] = useState(false);

  // Touch / swipe state
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const isDragging  = useRef(false);

  const getImageUrl = (url) => {
    if (!url) return '/placeholder.png';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE_URL}${url}`;
  };

  useEffect(() => { setSelectedImage(0); setQuantity(1); }, [activeProduct.id]);

  // Keyboard: Escape closes, Arrow keys change image
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape')      onClose();
      if (e.key === 'ArrowLeft')   prevImage();
      if (e.key === 'ArrowRight')  nextImage();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, activeProduct]);

  const images       = activeProduct.images || [];
  const totalImages  = images.length;

  const currentImgUrl = images[selectedImage]?.url
    ? getImageUrl(images[selectedImage].url)
    : '/placeholder.png';

  const isOutOfStock = activeProduct.totalStock === 0;
  const maxQuantity  = Math.min(activeProduct.totalStock, 10);

  const variantGroup = product.variantGroup;
  const siblings     = variantGroup?.products ?? [];
  const hasVariants  = siblings.length > 1;
  const variantType  = variantGroup?.variantType ?? null;

  // ── Image navigation ──────────────────────────────────────
  const prevImage = useCallback(() => {
    setSelectedImage(i => (i === 0 ? totalImages - 1 : i - 1));
  }, [totalImages]);

  const nextImage = useCallback(() => {
    setSelectedImage(i => (i === totalImages - 1 ? 0 : i + 1));
  }, [totalImages]);

  // ── Touch / swipe handlers ────────────────────────────────
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current  = false;
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (dx > dy && dx > 8) isDragging.current = true;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || totalImages <= 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (isDragging.current && Math.abs(dx) > 40) {
      dx < 0 ? nextImage() : prevImage();
    }
    touchStartX.current = null;
    touchStartY.current = null;
    isDragging.current  = false;
  };

  // ── Mouse drag (PC) ───────────────────────────────────────
  const mouseStartX  = useRef(null);
  const mouseActive  = useRef(false);

  const handleMouseDown = (e) => {
    if (totalImages <= 1) return;
    mouseStartX.current = e.clientX;
    mouseActive.current = true;
  };
  const handleMouseUp = (e) => {
    if (!mouseActive.current) return;
    mouseActive.current = false;
    const dx = e.clientX - mouseStartX.current;
    if (Math.abs(dx) > 40) dx < 0 ? nextImage() : prevImage();
  };
  const handleMouseLeave = () => { mouseActive.current = false; };

  // ── Bargain ───────────────────────────────────────────────
  useEffect(() => {
    if (activeProduct.bargainable && !isOutOfStock) checkBargainEligibility();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProduct.id, activeProduct.bargainable]);

  const checkBargainEligibility = async () => {
    setCheckingElig(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res    = await fetch(`${API_BASE_URL}/api/bargain/eligibility/${activeProduct.id}`, { headers });
      const result = await res.json();
      if (result.success) setEligibility(result.data);
    } catch (e) { console.error(e); }
    finally { setCheckingElig(false); }
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

  // ── Cart ──────────────────────────────────────────────────
  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) onAddToCart(activeProduct);
    setAddedFlash(true);
    setTimeout(() => { setAddedFlash(false); onClose(); }, 700);
  };

  const handleQuantityChange = (delta) => {
    const n = quantity + delta;
    if (n >= 1 && n <= maxQuantity) setQuantity(n);
  };

  // ── Notify ────────────────────────────────────────────────
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

          {/* ════════════════════════════════════════
              LEFT — Image slider panel
          ════════════════════════════════════════ */}
          <div className="modal-left">

            {/* Main image with swipe/drag/arrow support */}
            <div
              className="main-image"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              style={{ cursor: totalImages > 1 ? 'grab' : 'default', userSelect: 'none' }}
            >
              <img
                key={selectedImage}
                src={currentImgUrl}
                alt={activeProduct.name}
                onError={(e) => (e.target.src = '/placeholder.png')}
                draggable={false}
              />

              {isOutOfStock && (
                <div className="modal-stock-badge">Out of Stock</div>
              )}

              {/* Prev / Next arrows — only shown when multiple images */}
              {totalImages > 1 && (
                <>
                  <button
                    className="img-nav-btn img-nav-prev"
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={20} strokeWidth={2.5} />
                  </button>
                  <button
                    className="img-nav-btn img-nav-next"
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    aria-label="Next image"
                  >
                    <ChevronRight size={20} strokeWidth={2.5} />
                  </button>

                  {/* Dot indicators */}
                  <div className="img-dots">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        className={`img-dot${idx === selectedImage ? ' active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedImage(idx); }}
                        aria-label={`Image ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {/* Counter badge */}
                  <div className="img-counter">{selectedImage + 1} / {totalImages}</div>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {totalImages > 1 && (
              <div className="image-thumbnails">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`thumbnail${idx === selectedImage ? ' active' : ''}`}
                    onClick={() => setSelectedImage(idx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedImage(idx)}
                    aria-label={`Image ${idx + 1}`}
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

            {/* Stock pill */}
            <div className={`modal-stock-inline ${isOutOfStock ? 'out' : 'in'}`}>
              <Package size={12} />
              {isOutOfStock ? 'Out of Stock' : `${activeProduct.totalStock} in stock`}
            </div>
          </div>

          {/* ════════════════════════════════════════
              RIGHT — Details panel
              ORDER:  Category → Name → Price →
                      Variants → Qty →
                      Add to Cart + Wishlist →
                      Buy Now → Bargain →
                      Description → Meta/Seller
          ════════════════════════════════════════ */}
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

            {/* 6 — Add to Cart + Wishlist  (or Notify if OOS) */}
            <div className="modal-actions">
              {isOutOfStock ? (
                <button
                  className={`btn-modal-notify ${notified ? 'notified' : 'default'}`}
                  onClick={handleNotifyMe}
                  disabled={notifying || notified}
                >
                  {notified  ? <><CheckCircle2 size={16} /> Notified!</>  :
                   notifying ? <>Registering…</>                          :
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
                    <Heart size={17} fill={isWishlisted ? 'currentColor' : 'none'} />
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
