import React, { useState, useEffect } from 'react';
import { useToast } from './Toast';
import '../styles/CustomerBookingListPage.css';

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
        console.log('No access token available');
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
        console.log('Bookings loaded:', data);
        setBookings(data.content || data); // Handle paginated response
      } else {
        console.error('Failed to load bookings:', response.status);
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
        loadBookings(); // Refresh bookings
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
        loadBookings(); // Refresh bookings
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
        loadBookings(); // Refresh bookings
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      showToast(`Failed to submit review: ${error.message}`, 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#f59e0b';
      case 'CONFIRMED': return '#10b981';
      case 'COMPLETED': return '#3b82f6';
      case 'CANCELLED': return '#ef4444';
      case 'NO_SHOW': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return '⏳';
      case 'CONFIRMED': return '✅';
      case 'COMPLETED': return '🎉';
      case 'CANCELLED': return '❌';
      case 'NO_SHOW': return '👻';
      default: return '❓';
    }
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
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="customer-bookings">
      <ToastContainer />
      
      <div className="bookings-header">
        <h2>My Bookings</h2>
        <button onClick={loadBookings} className="refresh-button">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6"></path>
            <path d="M1 20v-6h6"></path>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22-6a9 9 0 0 1-14.85 14.85L23 14"></path>
          </svg>
          Refresh
        </button>
      </div>
      
      {/* Tabs */}
      <div className="booking-tabs">
        <button 
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All ({counts.all})
        </button>
        <button 
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({counts.pending})
        </button>
        <button 
          className={`tab-button ${activeTab === 'confirmed' ? 'active' : ''}`}
          onClick={() => setActiveTab('confirmed')}
        >
          Confirmed ({counts.confirmed})
        </button>
        <button 
          className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({counts.completed})
        </button>
        <button 
          className={`tab-button ${activeTab === 'cancelled' ? 'active' : ''}`}
          onClick={() => setActiveTab('cancelled')}
        >
          Cancelled ({counts.cancelled})
        </button>
      </div>

      {/* Bookings List */}
      <div className="bookings-list">
        {filteredBookings.length > 0 ? (
          filteredBookings.map(booking => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <div className="booking-title">
                  <h3>{booking.serviceName}</h3>
                  <span 
                    className="booking-status"
                    style={{ color: getStatusColor(booking.status) }}
                  >
                    {getStatusIcon(booking.status)} {booking.status}
                  </span>
                </div>
                <div className="booking-id">#{booking.id}</div>
              </div>
              
              <div className="booking-details">
                <div className="detail-row">
                  <div className="detail-item">
                    <strong>Contractor:</strong> {booking.contractorName}
                  </div>
                  <div className="detail-item">
                    <strong>Price:</strong> ${booking.price}
                  </div>
                </div>
                
                <div className="detail-row">
                  <div className="detail-item">
                    <strong>Date:</strong> {new Date(booking.startTime).toLocaleDateString('en-AU', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="detail-item">
                    <strong>Time:</strong> {new Date(booking.startTime).toLocaleTimeString('en-AU', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })} - {new Date(booking.endTime).toLocaleTimeString('en-AU', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                
                {booking.location && (
                  <div className="detail-item">
                    <strong>Location:</strong> {booking.location}
                  </div>
                )}
                
                {booking.notes && (
                  <div className="detail-item">
                    <strong>Notes:</strong> {booking.notes}
                  </div>
                )}

                {booking.customerRating && (
                  <div className="detail-item">
                    <strong>Your Rating:</strong> 
                    <div className="rating-display">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`star ${i < booking.customerRating ? 'filled' : 'empty'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="booking-actions">
                {booking.status === 'PENDING' && (
                  <button 
                    onClick={() => handleCancelBooking(booking.id)}
                    className="cancel-button"
                  >
                    Cancel Booking
                  </button>
                )}
                
                {booking.status === 'COMPLETED' && !booking.customerRating && (
                  <button 
                    onClick={() => openReviewModal(booking)}
                    className="review-button"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14l4-4h5a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
                      <path d="M19 7l-3 3-3-3"></path>
                    </svg>
                    Leave Review
                  </button>
                )}
                
                {(booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') && !booking.hasDispute && (
                  <button 
                    onClick={() => handleReportDispute(booking.id)}
                    className="dispute-button"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 9v4"></path>
                      <path d="M12 17h.01"></path>
                      <path d="M2 12h20"></path>
                      <path d="M5 19h14l2-7H3l2 7z"></path>
                    </svg>
                    Report Issue
                  </button>
                )}

                {booking.hasDispute && (
                  <div className="dispute-status">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 9v4"></path>
                      <path d="M12 17h.01"></path>
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                    Dispute Reported - {booking.disputeStatus || 'Under Review'}
                  </div>
                )}
              </div>

              {booking.createdAt && (
                <div className="booking-footer">
                  <small>Booked on {new Date(booking.createdAt).toLocaleDateString('en-AU')}</small>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="no-bookings">
            <div className="no-bookings-icon">📅</div>
            <h3>No bookings found</h3>
            <p>
              {activeTab === 'all' 
                ? "You haven't made any bookings yet. Browse our services to get started!"
                : `No ${activeTab} bookings found.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedBooking && (
        <ReviewModal
          booking={selectedBooking}
          onSubmit={handleSubmitReview}
          onClose={closeReviewModal}
        />
      )}
    </div>
  );
};

// Review Modal Component
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Rate Your Experience</h3>
          <button onClick={onClose} className="close-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="service-info">
            <h4>{booking.serviceName}</h4>
            <p>with {booking.contractorName}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>How was your experience?</label>
              <div className="rating-input">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-button ${star <= (hoveredRating || rating) ? 'filled' : 'empty'}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                  >
                    ★
                  </button>
                ))}
              </div>
              <small className="rating-text">
                {rating === 0 && 'Click to rate'}
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="review">Tell us more about your experience (optional)</label>
              <textarea
                id="review"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows="4"
                placeholder="Share your thoughts about the service..."
                maxLength="500"
              />
              <small className="char-count">{review.length}/500</small>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="cancel-button" disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="submit-button" disabled={loading || rating === 0}>
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
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
    </div>
  );
};

export default CustomerBookings;