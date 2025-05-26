import React, { useState, useEffect } from 'react';
import { useToast } from './Toast';
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Star,
  MessageCircle,
  AlertTriangle,
  RefreshCw,
  User,
  Phone,
  Mail
} from 'lucide-react';

const CustomerBookings = ({ userEmail }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        showToast('Please log in to view your bookings', 'error');
        return;
      }

      const response = await fetch('http://localhost:8083/api/bookings/customer', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.content || data);
      } else {
        if (response.status === 401) {
          showToast('Please log in to view your bookings', 'error');
        } else {
          showToast('Failed to load bookings', 'error');
        }
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      showToast('Error loading bookings. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8083/api/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: 'Cancelled by customer' })
      });

      if (response.ok) {
        showToast('Booking cancelled successfully', 'success');
        loadBookings();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      showToast(`Failed to cancel booking: ${error.message}`, 'error');
    }
  };

  const handleReportDispute = async (bookingId) => {
    const reason = prompt('Please describe the issue with this booking:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8083/api/bookings/${bookingId}/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        showToast('Dispute reported successfully', 'success');
        loadBookings();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to report dispute');
      }
    } catch (error) {
      console.error('Error reporting dispute:', error);
      showToast(`Failed to report dispute: ${error.message}`, 'error');
    }
  };

  const openReviewModal = (booking) => {
    setSelectedBooking(booking);
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedBooking(null);
  };

  const handleSubmitReview = async (rating, review) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8083/api/bookings/${selectedBooking.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, review })
      });

      if (response.ok) {
        showToast('Review submitted successfully', 'success');
        closeReviewModal();
        loadBookings();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      showToast(`Failed to submit review: ${error.message}`, 'error');
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      PENDING: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '⏳',
        label: 'Pending'
      },
      CONFIRMED: {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: '✅',
        label: 'Confirmed'
      },
      COMPLETED: {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '🎉',
        label: 'Completed'
      },
      CANCELLED: {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: '❌',
        label: 'Cancelled'
      },
      NO_SHOW: {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: '👻',
        label: 'No Show'
      }
    };
    return configs[status] || configs.PENDING;
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return booking.status === 'PENDING';
    if (activeTab === 'confirmed') return booking.status === 'CONFIRMED';
    if (activeTab === 'completed') return booking.status === 'COMPLETED';
    if (activeTab === 'cancelled') return booking.status === 'CANCELLED';
    return false;
  });

  const getTabCounts = () => {
    return {
      all: bookings.length,
      pending: bookings.filter(b => b.status === 'PENDING').length,
      confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
      completed: bookings.filter(b => b.status === 'COMPLETED').length,
      cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
    };
  };

  const counts = getTabCounts();

  if (loading) {
    return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          color: '#6b7280'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
          }}></div>
          <p style={{ fontSize: '16px', fontWeight: '500' }}>Loading your bookings...</p>
        </div>
    );
  }

  return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px',
        backgroundColor: '#f9fafb',
        minHeight: '100vh'
      }}>
        <ToastContainer />

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#111827',
              margin: '0 0 8px 0'
            }}>
              My Bookings
            </h1>
            <p style={{
              color: '#6b7280',
              margin: 0,
              fontSize: '16px'
            }}>
              Manage and track your service bookings
            </p>
          </div>

          <button
              onClick={loadBookings}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                backgroundColor: '#f97316',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#ea580c'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#f97316'}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '8px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          gap: '4px'
        }}>
          {[
            { key: 'all', label: 'All', count: counts.all },
            { key: 'pending', label: 'Pending', count: counts.pending },
            { key: 'confirmed', label: 'Confirmed', count: counts.confirmed },
            { key: 'completed', label: 'Completed', count: counts.completed },
            { key: 'cancelled', label: 'Cancelled', count: counts.cancelled }
          ].map(tab => (
              <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: activeTab === tab.key ? '#f97316' : 'transparent',
                    color: activeTab === tab.key ? 'white' : '#6b7280'
                  }}
              >
                {tab.label} ({tab.count})
              </button>
          ))}
        </div>

        {/* Bookings List */}
        {filteredBookings.length > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {filteredBookings.map(booking => {
                const statusConfig = getStatusConfig(booking.status);

                return (
                    <div
                        key={booking.id}
                        style={{
                          backgroundColor: 'white',
                          borderRadius: '16px',
                          padding: '24px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                          border: '1px solid #e5e7eb',
                          transition: 'all 0.2s',
                          position: 'relative',
                          overflow: 'hidden',
                          width: '100%'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
                        }}
                    >
                      {/* Top Row - Status Badges */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginBottom: '16px',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          border: '1px solid',
                          ...{
                            backgroundColor: statusConfig.color.includes('yellow') ? '#fef3c7' :
                                statusConfig.color.includes('green') ? '#d1fae5' :
                                    statusConfig.color.includes('blue') ? '#dbeafe' :
                                        statusConfig.color.includes('red') ? '#fee2e2' : '#f3f4f6',
                            color: statusConfig.color.includes('yellow') ? '#92400e' :
                                statusConfig.color.includes('green') ? '#065f46' :
                                    statusConfig.color.includes('blue') ? '#1e40af' :
                                        statusConfig.color.includes('red') ? '#991b1b' : '#374151',
                            borderColor: statusConfig.color.includes('yellow') ? '#fbbf24' :
                                statusConfig.color.includes('green') ? '#10b981' :
                                    statusConfig.color.includes('blue') ? '#3b82f6' :
                                        statusConfig.color.includes('red') ? '#ef4444' : '#9ca3af'
                          }
                        }}>
                          {statusConfig.icon} {statusConfig.label}
                        </div>

                        {/* Dispute Warning */}
                        {booking.hasDispute && (
                            <div style={{
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: '#fef2f2',
                              color: '#991b1b',
                              border: '1px solid #fecaca',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <AlertTriangle size={12} />
                              Dispute: REPORTED
                            </div>
                        )}
                      </div>

                      {/* Main Content Layout */}
                      <div style={{
                        display: 'flex',
                        gap: '24px',
                        alignItems: 'flex-start'
                      }}>
                        {/* Left Side - Service Info & Contractor */}
                        <div style={{ flex: 1 }}>
                          {/* Service Title */}
                          <div style={{ marginBottom: '16px' }}>
                            <h3 style={{
                              fontSize: '20px',
                              fontWeight: '600',
                              color: '#111827',
                              margin: '0 0 4px 0'
                            }}>
                              {booking.serviceName}
                            </h3>
                            <p style={{
                              color: '#6b7280',
                              fontSize: '14px',
                              margin: 0
                            }}>
                              Booking #{booking.id}
                            </p>
                          </div>

                          {/* Contractor Info */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '8px'
                          }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: '#f97316',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '600'
                            }}>
                              {booking.contractorName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p style={{
                                fontWeight: '500',
                                color: '#111827',
                                margin: '0 0 2px 0'
                              }}>
                                {booking.contractorName}
                              </p>
                              <p style={{
                                fontSize: '14px',
                                color: '#6b7280',
                                margin: 0
                              }}>
                                Service Provider
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Middle - Booking Details */}
                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '16px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Calendar size={16} style={{ color: '#6b7280' }} />
                              <span style={{ fontSize: '14px', color: '#374151' }}>
                          {new Date(booking.startTime).toLocaleDateString('en-AU', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Clock size={16} style={{ color: '#6b7280' }} />
                              <span style={{ fontSize: '14px', color: '#374151' }}>
                          {new Date(booking.startTime).toLocaleTimeString('en-AU', {
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </span>
                            </div>
                            {booking.location && (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  gridColumn: '1 / -1'
                                }}>
                                  <MapPin size={16} style={{ color: '#6b7280' }} />
                                  <span style={{ fontSize: '14px', color: '#374151' }}>
                            {booking.location}
                          </span>
                                </div>
                            )}
                          </div>
                        </div>

                        {/* Right Side - Price & Actions */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: '16px',
                          minWidth: '200px'
                        }}>
                          {/* Price */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           
                            <span style={{
                              fontSize: '24px',
                              fontWeight: '700',
                              color: '#059669'
                            }}>
                        ${booking.price}
                      </span>
                          </div>

                          {/* Rating Display */}
                          {booking.customerRating && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                backgroundColor: '#fef3c7',
                                borderRadius: '6px'
                              }}>
                                <span style={{ fontSize: '12px', color: '#92400e' }}>Your rating:</span>
                                <div style={{ display: 'flex', gap: '2px' }}>
                                  {[...Array(5)].map((_, i) => (
                                      <Star
                                          key={i}
                                          size={14}
                                          style={{
                                            color: i < booking.customerRating ? '#fbbf24' : '#d1d5db',
                                            fill: i < booking.customerRating ? '#fbbf24' : 'transparent'
                                          }}
                                      />
                                  ))}
                                </div>
                              </div>
                          )}

                          {/* Action Buttons */}
                          <div style={{
                            display: 'flex',
                            gap: '8px',
                            flexWrap: 'wrap',
                            justifyContent: 'flex-end'
                          }}>
                            {booking.hasDispute ? (
                                <div style={{
                                  fontSize: '12px',
                                  color: '#991b1b',
                                  fontWeight: '500'
                                }}>
                                  Dispute under review
                                </div>
                            ) : (
                                <>
                                  {booking.status === 'PENDING' && (
                                      <button
                                          onClick={() => handleCancelBooking(booking.id)}
                                          style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#fee2e2',
                                            color: '#991b1b',
                                            border: '1px solid #fecaca',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                          }}
                                      >
                                        Cancel Booking
                                      </button>
                                  )}

                                  {booking.status === 'COMPLETED' && !booking.customerRating && (
                                      <button
                                          onClick={() => openReviewModal(booking)}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '8px 16px',
                                            backgroundColor: '#dbeafe',
                                            color: '#1e40af',
                                            border: '1px solid #93c5fd',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                          }}
                                      >
                                        <Star size={14} />
                                        Leave Review
                                      </button>
                                  )}

                                  {(booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') && (
                                      <button
                                          onClick={() => handleReportDispute(booking.id)}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '8px 16px',
                                            backgroundColor: '#fef3c7',
                                            color: '#92400e',
                                            border: '1px solid #fbbf24',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                          }}
                                      >
                                        <AlertTriangle size={14} />
                                        Report Issue
                                      </button>
                                  )}
                                </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                );
              })}
            </div>
        ) : (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '16px'
              }}>
                <Calendar size={48} style={{ color: '#f97316' }} />
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px'
              }}>
                No bookings found
              </h3>
              <p style={{
                color: '#6b7280',
                fontSize: '16px',
                maxWidth: '400px',
                margin: '0 auto'
              }}>
                {activeTab === 'all'
                    ? "You haven't made any bookings yet. Browse our services to get started!"
                    : `No ${activeTab} bookings found.`
                }
              </p>
            </div>
        )}

        {/* Review Modal */}
        {showReviewModal && selectedBooking && (
            <ReviewModal
                booking={selectedBooking}
                onSubmit={handleSubmitReview}
                onClose={closeReviewModal}
            />
        )}

        {/* CSS for animation */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
  );
};

// Enhanced Review Modal Component
const ReviewModal = ({ booking, onSubmit, onClose }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(rating, review);
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setLoading(false);
    }
  };

  const ratingLabels = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };

  return (
      <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={onClose}
      >
        <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#111827',
              margin: 0
            }}>
              Rate Your Experience
            </h3>
            <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#6b7280',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
            >
              ×
            </button>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <h4 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 4px 0'
            }}>
              {booking.serviceName}
            </h4>
            <p style={{
              color: '#6b7280',
              margin: 0
            }}>
              with {booking.contractorName}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: '500',
                color: '#111827',
                marginBottom: '12px'
              }}>
                How was your experience?
              </label>
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '8px'
              }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '32px',
                          cursor: 'pointer',
                          color: star <= (hoveredRating || rating) ? '#fbbf24' : '#d1d5db',
                          transition: 'color 0.2s'
                        }}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                    >
                      ★
                    </button>
                ))}
              </div>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: 0
              }}>
                {rating === 0 ? 'Click to rate' : ratingLabels[rating]}
              </p>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label
                  htmlFor="review"
                  style={{
                    display: 'block',
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#111827',
                    marginBottom: '8px'
                  }}
              >
                Tell us more about your experience (optional)
              </label>
              <textarea
                  id="review"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows="4"
                  placeholder="Share your thoughts about the service..."
                  maxLength="500"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
              />
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                textAlign: 'right',
                margin: '4px 0 0 0'
              }}>
                {review.length}/500
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'white',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
              >
                Cancel
              </button>
              <button
                  type="submit"
                  disabled={loading || rating === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    backgroundColor: (loading || rating === 0) ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: (loading || rating === 0) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
              >
                {loading ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid transparent',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Submitting...
                    </>
                ) : (
                    'Submit Review'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
};

export default CustomerBookings;