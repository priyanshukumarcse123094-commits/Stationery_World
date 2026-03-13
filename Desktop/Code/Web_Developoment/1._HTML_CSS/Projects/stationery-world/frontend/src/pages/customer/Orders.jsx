import { useState, useEffect } from 'react';
import { authUtils } from '../../utils/auth';
import './Orders.css';

const API = 'http://localhost:3000';

// Helper to get full image URL
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API}${url}`;
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [orderToReturn, setOrderToReturn] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = authUtils.getToken();
      
      if (!token) {
        setError('Please login to view your orders');
        return;
      }

      const response = await fetch(`${API}/api/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const data = await response.json();

      if (data?.success) {
        const sortedOrders = (data.data || []).sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setOrders(sortedOrders);
      } else {
        setError(data?.message || 'Failed to load orders');
      }
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'ALL') return true;
    return order.status === filter;
  });

  const getStatusBadgeStyle = (status) => {
    switch(status) {
      case 'PENDING':
        return { background: '#fff9c4', color: '#f57f17', border: '1px solid #f9a825' };
      case 'PROCESSING':
        return { background: '#e1f5fe', color: '#0277bd', border: '1px solid #03a9f4' };
      case 'CONFIRMED':
      case 'PAID':
        return { background: '#c8e6c9', color: '#388e3c', border: '1px solid #66bb6a' };
      case 'SHIPPED':
        return { background: '#bbdefb', color: '#1976d2', border: '1px solid #42a5f5' };
      case 'DELIVERED':
        return { background: '#a5d6a7', color: '#2e7d32', border: '1px solid #4caf50' };
      case 'RETURN_REQUESTED':
        return { background: '#ffe0b2', color: '#e65100', border: '1px solid #ffb74d' };
      case 'CANCELLED':
      case 'RETURNED':
        return { background: '#ffcdd2', color: '#c62828', border: '1px solid #ef5350' };
      default:
        return { background: '#f5f5f5', color: '#666', border: '1px solid #ddd' };
    }
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  const openReturnModal = (order) => {
    setOrderToReturn(order);
    setReturnReason('');
    setShowReturnModal(true);
  };

  const handleReturn = async () => {
    if (!orderToReturn || !returnReason.trim()) {
      alert('Please provide a reason for return');
      return;
    }

    setReturnLoading(true);
    try {
      const token = authUtils.getToken();
      const res = await fetch(`${API}/api/orders/${orderToReturn.id}/return`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: returnReason })
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.message);

      alert('Return request submitted successfully! Awaiting admin approval. ✓');
      setShowReturnModal(false);
      setOrderToReturn(null);
      setReturnReason('');
      await loadOrders(); // Refresh orders
    } catch (err) {
      alert('Return failed: ' + err.message);
    } finally {
      setReturnLoading(false);
    }
  };

  const getOrderTypeDisplay = (type) => {
    switch(type) {
      case 'SELF':
        return { icon: '🏠', label: 'Self Order' };
      case 'ADMIN':
        return { icon: '👨‍💼', label: 'Admin Order' };
      case 'CUSTOMER':
      default:
        return { icon: '🛒', label: 'Customer Order' };
    }
  };

  if (loading) {
    return (
      <div className="card">
        <h3>My Orders</h3>
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          Loading your orders...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h3>My Orders</h3>
        <div style={{
          padding: 20,
          background: '#f8d7da',
          color: '#721c24',
          borderRadius: 8,
          border: '1px solid #f5c6cb'
        }}>
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3>My Orders ({orders.length})</h3>
        <button className="btn outline" onClick={loadOrders}>
          🔄 Refresh
        </button>
      </div>

      {/* Filter Buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: '8px 16px',
              border: filter === status ? '2px solid #007bff' : '1px solid #ddd',
              background: filter === status ? '#e7f3ff' : 'white',
              color: filter === status ? '#007bff' : '#333',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: filter === status ? 600 : 400
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <p style={{ fontSize: 16, marginBottom: 8 }}>No {filter.toLowerCase()} orders found</p>
          <p style={{ fontSize: 14, color: '#999' }}>
            {filter === 'ALL' ? 'Start shopping to create your first order!' : `You don't have any ${filter.toLowerCase()} orders.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredOrders.map(order => {
            const typeDisplay = getOrderTypeDisplay(order.type);
            const firstItem = order.items?.[0];
            const imageUrl = getImageUrl(firstItem?.productPhoto);
            
            return (
              <div
                key={order.id}
                style={{
                  padding: 20,
                  border: '1px solid #e0e0e0',
                  borderRadius: 8,
                  background: 'white',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                }}
                onClick={() => openOrderDetails(order)}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ display: 'flex', gap: 16 }}>
                  {/* Product Image */}
                  {imageUrl && (
                    <div style={{
                      width: 100,
                      height: 100,
                      flexShrink: 0,
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '1px solid #e0e0e0',
                      background: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img
                        src={imageUrl}
                        alt={firstItem.productName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<span style="font-size:32px">📦</span>';
                        }}
                      />
                    </div>
                  )}

                  {/* Order Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                          Order #{order.uid}
                        </div>
                        <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                          Placed on {formatDate(order.createdAt)}
                        </div>
                        {/* Seller/Placer Info */}
                        {order.placedBy && (
                          <div style={{ 
                            fontSize: 12, 
                            color: '#374151',
                            marginTop: 6,
                            padding: '4px 10px',
                            background: '#f0f9ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: 6,
                            display: 'inline-block'
                          }}>
                            👤 Sold by: <strong>{order.placedBy.name}</strong> 
                            <span style={{ 
                              marginLeft: 6,
                              padding: '2px 6px',
                              background: order.placedBy.role === 'ADMIN' ? '#fef2f2' : '#f0fdf4',
                              color: order.placedBy.role === 'ADMIN' ? '#dc2626' : '#16a34a',
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 700
                            }}>
                              {order.placedBy.role}
                            </span>
                          </div>
                        )}
                        {order.admin && order.type === 'ADMIN' && (
                          <div style={{ 
                            fontSize: 12, 
                            color: '#92400e',
                            marginTop: 6,
                            padding: '4px 10px',
                            background: '#fef3c7',
                            border: '1px solid #fde68a',
                            borderRadius: 6,
                            display: 'inline-block'
                          }}>
                            👨‍💼 Created by Admin: <strong>{order.admin.name}</strong>
                          </div>
                        )}
                      </div>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        ...getStatusBadgeStyle(order.status)
                      }}>
                        {order.status}
                      </span>
                    </div>

                    {/* Product Preview */}
                    {firstItem && (
                      <div style={{ 
                        marginTop: 8, 
                        padding: 8, 
                        background: '#f9fafb', 
                        borderRadius: 6,
                        fontSize: 13
                      }}>
                        <strong>{firstItem.productName}</strong>
                        {order.items.length > 1 && (
                          <span style={{ color: '#666', marginLeft: 8 }}>
                            +{order.items.length - 1} more item{order.items.length > 2 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    )}

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginTop: 12, 
                      paddingTop: 12, 
                      borderTop: '1px solid #f0f0f0' 
                    }}>
                      <div style={{ display: 'flex', gap: 20 }}>
                        <div>
                          <div style={{ fontSize: 12, color: '#666' }}>Items</div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{order.items?.length || 0}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: '#666' }}>Total</div>
                          <div style={{ fontSize: 16, fontWeight: 600, color: '#2e7d32' }}>
                            {formatCurrency(order.totalAmount || order.totalSp)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: '#666' }}>Type</div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>
                            {typeDisplay.icon} {typeDisplay.label}
                          </div>
                        </div>
                      </div>
                      <button
                        className="btn outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openOrderDetails(order);
                        }}
                        style={{ fontSize: 13 }}
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div 
          className="modal" 
          onClick={closeOrderDetails}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20
          }}
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 12,
              maxWidth: 900,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: 24,
              color: '#333'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 20, color: '#1f2937' }}>Order #{selectedOrder.uid}</h4>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                </div>
                {/* Seller/Admin Info in Modal */}
                {selectedOrder.placedBy && (
                  <div style={{ 
                    marginTop: 8, 
                    padding: 10, 
                    background: '#f0f9ff', 
                    border: '1px solid #bfdbfe',
                    borderRadius: 8,
                    fontSize: 13,
                    display: 'inline-block'
                  }}>
                    👤 Sold by: <strong>{selectedOrder.placedBy.name}</strong>
                    <span style={{ 
                      marginLeft: 8,
                      padding: '2px 8px',
                      background: selectedOrder.placedBy.role === 'ADMIN' ? '#fef2f2' : '#f0fdf4',
                      color: selectedOrder.placedBy.role === 'ADMIN' ? '#dc2626' : '#16a34a',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700
                    }}>
                      {selectedOrder.placedBy.role}
                    </span>
                  </div>
                )}
                {selectedOrder.admin && selectedOrder.type === 'ADMIN' && (
                  <div style={{ 
                    marginTop: 8, 
                    padding: 10, 
                    background: '#fef3c7', 
                    border: '1px solid #fde68a',
                    borderRadius: 8,
                    fontSize: 13,
                    display: 'inline-block'
                  }}>
                    👨‍💼 Created by Admin: <strong>{selectedOrder.admin.name}</strong>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  ...getStatusBadgeStyle(selectedOrder.status)
                }}>
                  {selectedOrder.status}
                </span>
                {selectedOrder.status === 'DELIVERED' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedOrder(null); openReturnModal(selectedOrder); }}
                    style={{
                      background: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      padding: '8px 16px',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    ↩ Return Order
                  </button>
                )}
                <button 
                  onClick={closeOrderDetails}
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
              {/* Left Column - Shipping Info */}
              <div style={{ flex: 1 }}>
                <h5 style={{ margin: '0 0 12px 0', fontSize: 15, color: '#374151' }}>Shipping Address</h5>
                <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    {selectedOrder.recipientName}
                  </div>
                  {selectedOrder.recipientPhone && (
                    <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                      📞 {selectedOrder.recipientPhone}
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: '#666', marginTop: 8 }}>
                    {selectedOrder.addressLine1}
                  </div>
                  {selectedOrder.addressLine2 && (
                    <div style={{ fontSize: 13, color: '#666' }}>{selectedOrder.addressLine2}</div>
                  )}
                  <div style={{ fontSize: 13, color: '#666' }}>
                    {selectedOrder.city}, {selectedOrder.state} {selectedOrder.postalCode}
                  </div>
                  <div style={{ fontSize: 13, color: '#666' }}>{selectedOrder.country}</div>
                </div>

                {selectedOrder.note && (
                  <div style={{ marginTop: 12 }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: 15, color: '#374151' }}>Order Note</h5>
                    <div style={{ padding: 12, background: '#fffbeb', borderRadius: 8, border: '1px solid #fef3c7' }}>
                      <div style={{ fontSize: 13, color: '#92400e' }}>{selectedOrder.note}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Order Items */}
              <div style={{ flex: 1 }}>
                <h5 style={{ margin: '0 0 12px 0', fontSize: 15, color: '#374151' }}>Order Items</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(selectedOrder.items || []).map((item, idx) => {
                    const itemImageUrl = getImageUrl(item.productPhoto);
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          gap: 12,
                          padding: 12,
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          background: 'white'
                        }}
                      >
                        {itemImageUrl && (
                          <img
                            src={itemImageUrl}
                            alt={item.productName}
                            style={{
                              width: 60,
                              height: 60,
                              objectFit: 'cover',
                              borderRadius: 6,
                              border: '1px solid #e5e7eb',
                              flexShrink: 0,
                              background: '#f1f5f9'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<div style="width:60px;height:60px;display:flex;align-items:center;justify-content:center;background:#f1f5f9;border-radius:6px"><span style="font-size:24px">📦</span></div>';
                            }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                            {item.productName}
                          </div>
                          <div style={{ fontSize: 12, color: '#666' }}>
                            Qty: {item.quantity} × {formatCurrency(item.sp)}
                          </div>
                          {item.bargainApplied && (
                            <div style={{ 
                              fontSize: 11, 
                              color: '#16a34a', 
                              marginTop: 2,
                              fontWeight: 500 
                            }}>
                              ✓ Bargain Applied
                            </div>
                          )}
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#2e7d32', marginTop: 4 }}>
                            {formatCurrency(item.subtotalSp)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div style={{
              padding: 16,
              background: '#f9fafb',
              borderRadius: 8,
              marginTop: 20
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: '#666' }}>Subtotal</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {formatCurrency(selectedOrder.totalSp)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: '#666' }}>Shipping</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#2e7d32' }}>FREE</span>
              </div>
              <div style={{
                borderTop: '2px solid #e5e7eb',
                paddingTop: 8,
                marginTop: 8,
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>Total</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#2e7d32' }}>
                  {formatCurrency(selectedOrder.totalAmount || selectedOrder.totalSp)}
                </span>
              </div>
            </div>

            {/* Order Timeline */}
            <div style={{ marginTop: 20 }}>
              <h5 style={{ margin: '0 0 12px 0', fontSize: 15, color: '#374151' }}>Order Timeline</h5>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                <div style={{ marginBottom: 6 }}>
                  <strong>Created:</strong> {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                </div>
                <div>
                  <strong>Last Updated:</strong> {new Date(selectedOrder.updatedAt).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && orderToReturn && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}
          onClick={() => !returnLoading && setShowReturnModal(false)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 500
            }}
            onClick={e => e.stopPropagation()}
          >
            <h4 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>Request Return for Order #{orderToReturn.uid}</h4>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
              Please provide a reason for the return. Your request will be sent to the admin for approval.
            </p>
            <textarea
              value={returnReason}
              onChange={e => setReturnReason(e.target.value)}
              placeholder="Reason for return..."
              rows={4}
              style={{
                width: '100%', padding: 12, border: '1px solid #d1d5db',
                borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                onClick={() => setShowReturnModal(false)}
                disabled={returnLoading}
                style={{
                  flex: 1, padding: 12, border: '1px solid #d1d5db',
                  background: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 14
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReturn}
                disabled={returnLoading || !returnReason.trim()}
                style={{
                  flex: 1, padding: 12, border: 'none',
                  background: returnLoading || !returnReason.trim() ? '#cbd5e1' : '#f59e0b',
                  color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600,
                  cursor: returnLoading || !returnReason.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {returnLoading ? 'Processing...' : 'Submit Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}