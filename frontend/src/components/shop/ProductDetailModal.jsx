import React, { useState, useEffect } from 'react';
import {
  X, Heart, ShoppingCart, Package,
  Minus, Plus, Zap, Bell, Tag, CheckCircle2
} from 'lucide-react';
import BargainModal from './BargainModal';
import './ProductDetailModal.css';
import { API_BASE_URL } from '../../config/constants';

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

  // Bargain state
  const [showBargainModal, setShowBargainModal]       = useState(false);
  const [eligibility, setEligibility]                 = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  /* ── helpers ── */
  const getImageUrl = (url) => {
    if (!url) return '/placeholder.png';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE_URL}${url}`;
  };

  const images        = product.images || [];
  const currentImgUrl = images[selectedImage]?.url
    ? getImageUrl(images[selectedImage].url)
    : '/placeholder.png';

  const isOutOfStock = product.totalStock === 0;
  const maxQuantity  = Math.min(product.totalStock, 10);

  /* ── Bargain eligibility ── */
  useEffect(() => {
    if (product.bargainable && !isOutOfStock) checkBargainEligibility();
  }, [product.id, product.bargainable]);

  const checkBargainEligibility = async () => {
    setCheckingEligibility(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res    = await fetch(`${API_BASE_URL}/api/bargain/eligibility/${product.id}`, { headers });
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
    for (let i = 0; i < quantity; i++) onAddToCart(product);
    setAddedFlash(true);
    setTimeout(() => { setAddedFlash(false); onClose(); }, 700);
  };

  const handleQuantityChange = (delta) => {
    const n = quantity + delta;
    if (n >= 1 && n <= maxQuantity) setQuantity(n);
  };

  /* ── Notify ── */
  const handleNotifyMe = async () => {
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
      if (result.success) setNotified(true);
      else alert(result.message || 'Failed to register notification');
    } catch (err) {
      console.error('Notify error:', err);
      alert('Failed to register notification');
    } finally {
      setNotifying(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={product.name}>
        <div className="product-detail-modal" onClick={(e) => e.stopPropagation()}>

          {/* Close */}
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2.5} />
          </button>

          <div className="modal-content">

            {/* ══ LEFT — Images ══ */}
            <div className="modal-left">
              <div className="main-image">
                <img
                  src={currentImgUrl}
                  alt={product.name}
                  onError={(e) => (e.target.src = '/placeholder.png')}
                />
                {isOutOfStock && (
                  <div className="modal-stock-badge">Out of Stock</div>
                )}
              </div>

              {images.length > 1 && (
                <div className="image-thumbnails">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`thumbnail ${idx === selectedImage ? 'active' : ''}`}
                      onClick={() => setSelectedImage(idx)}
                    >
                      <img
                        src={getImageUrl(img.url)}
                        alt={`${product.name} view ${idx + 1}`}
                        onError={(e) => (e.target.src = '/placeholder.png')}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ══ RIGHT — Details ══ */}
            <div className="modal-right">

              {/* Category */}
              <div className="modal-category">
                <Tag size={11} style={{ marginRight: 5 }} />
                {product.category}
              </div>

              {/* Title */}
              <h2 className="modal-title">{product.name}</h2>

              {/* Price + Stock */}
              <div className="modal-price-section">
                <div className="modal-price">
                  ₹{parseFloat(product.baseSellingPrice).toFixed(2)}
                </div>
                <div className={`modal-stock ${isOutOfStock ? 'out' : 'in'}`}>
                  <Package size={15} />
                  {isOutOfStock ? 'Out of Stock' : `${product.totalStock} in stock`}
                </div>
              </div>

              {/* Description */}
              <div className="modal-description">
                <h4>Description</h4>
                <p>{product.description || 'No description available.'}</p>
              </div>

              <div className="modal-divider" />

              {/* Quantity */}
              {!isOutOfStock && (
                <div className="quantity-selector">
                  <label>Quantity</label>
                  <div className="quantity-controls">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="quantity-value">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= maxQuantity}
                      aria-label="Increase quantity"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                  <span className="max-qty">Maximum per order: {maxQuantity}</span>
                </div>
              )}

              {/* ✨ Bargain Button */}
              {!isOutOfStock && product.bargainable && eligibility?.canBargain && (
                <button
                  className="btn-modal-bargain"
                  onClick={() => setShowBargainModal(true)}
                >
                  💰 Make an Offer
                  {eligibility.metadata.remainingAttempts > 0 && (
                    <span className="attempts-badge">
                      {eligibility.metadata.remainingAttempts} attempts left
                    </span>
                  )}
                </button>
              )}

              {/* Buy Now */}
              {!isOutOfStock && onBuyNow && (
                <button
                  className="btn-modal-buynow"
                  onClick={() => onBuyNow(product)}
                >
                  <Zap size={17} />
                  Buy Now
                </button>
              )}

              {/* Add to Cart + Wishlist — or Notify */}
              <div className="modal-actions">
                {isOutOfStock ? (
                  <button
                    className={`btn-modal-notify ${notified ? 'notified' : 'default'}`}
                    onClick={handleNotifyMe}
                    disabled={notifying || notified}
                  >
                    {notified ? (
                      <><CheckCircle2 size={17} /> You'll be notified</>
                    ) : notifying ? (
                      <>Registering…</>
                    ) : (
                      <><Bell size={17} /> Notify Me When Available</>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      className={`btn-modal-cart${addedFlash ? " success" : ""}`}
                      onClick={handleAddToCart}
                      disabled={addedFlash}
                    >
                      {addedFlash ? (
                        <><CheckCircle2 size={18} /> Added!</>
                      ) : (
                        <><ShoppingCart size={18} /> Add to Cart</>
                      )}
                    </button>
                    <button
                      className={`btn-modal-wishlist ${isWishlisted ? 'wishlisted' : ''}`}
                      onClick={() => { onToggleWishlist?.(product); onClose(); }}
                    >
                      <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
                      {isWishlisted ? 'Saved' : 'Wishlist'}
                    </button>
                  </>
                )}
              </div>

              {/* Meta Info */}
              <div className="product-meta-info">
                <div className="meta-item"><strong>SKU:</strong> {product.id}</div>
                <div className="meta-item"><strong>Category:</strong> {product.category}</div>
                {product.subCategory && (
                  <div className="meta-item"><strong>Sub-category:</strong> {product.subCategory}</div>
                )}
                <div className="meta-item">
                  <strong>Status:</strong> {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                </div>

                {/* Seller */}
                {product.createdBy && (
                  <div className="seller-info-block">
                    <div className="seller-avatar">👤</div>
                    <div className="seller-info-text">
                      <span className="seller-name">{product.createdBy.name}</span>
                      <span className={`seller-role-badge ${product.createdBy.role === 'ADMIN' ? 'admin' : 'seller'}`}>
                        {product.createdBy.role}
                      </span>
                    </div>
                  </div>
                )}
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
          product={product}
          eligibility={eligibility}
          onSuccess={handleBargainSuccess}
        />
      )}
    </>
  );
}
