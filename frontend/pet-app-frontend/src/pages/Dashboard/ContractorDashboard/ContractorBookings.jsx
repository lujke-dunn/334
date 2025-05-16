import React, { useState, useEffect } from 'react';
import { getAccessToken } from '../../../utils/api';
import '../../../styles/ContractorBookingListPage.css'


const ContractorBookings = ({ contractorId }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    loadBookings();
    
    // Set up polling for new bookings (check every 30 seconds)
    const interval = setInterval(loadBookings, 30000);
    
    return () => clearInterval(interval);
  }, [contractorId]);

  const loadBookings = async () => {
    try {
      if (!contractorId) {
        console.log('No contractor ID available');
        return;
      }
      
      const token = getAccessToken();
      const response = await fetch(`http://localhost:8083/api/bookings/contractor`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded bookings:', data);
        setBookings(data.content || data);
      } else {
        console.error('Failed to load bookings:', response.status);
        setError('Failed to load bookings');
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      setError('Error loading bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (bookingId, action) => {
    try {
      const token = getAccessToken();
      const response = await fetch(`http://localhost:8083/api/bookings/${bookingId}/${action}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        loadBookings(); // Refresh bookings
      } else {
        alert(`Failed to ${action} booking`);
      }
    } catch (error) {
      console.error(`Error ${action} booking:`, error);
      alert(`Error ${action}ing booking`);
    }
  };

  // Filter bookings by status
  const pendingBookings = bookings.filter(booking => booking.status === 'PENDING');
  const confirmedBookings = bookings.filter(booking => booking.status === 'CONFIRMED');
  const completedBookings = bookings.filter(booking => booking.status === 'COMPLETED');
  const cancelledBookings = bookings.filter(booking => booking.status === 'CANCELLED');

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-default';
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const BookingCard = ({ booking, isPending = false }) => (
    <div className={`booking-card ${getStatusColor(booking.status)} ${isPending ? 'new-request' : ''}`}>
      <div className="booking-header">
        <h3>{booking.serviceName}</h3>
        <span className={`booking-status ${getStatusColor(booking.status)}`}>
          {booking.status}
        </span>
      </div>
      
      <div className="booking-details">
        <div className="booking-info">
          <div className="info-row">
            <strong>Customer:</strong> {booking.customerName}
          </div>
          <div className="info-row">
            <strong>Email:</strong> {booking.customerEmail}
          </div>
          <div className="info-row">
            <strong>Start:</strong> {formatDateTime(booking.startTime)}
          </div>
          <div className="info-row">
            <strong>End:</strong> {formatDateTime(booking.endTime)}
          </div>
          <div className="info-row">
            <strong>Location:</strong> {booking.location}
          </div>
          <div className="info-row">
            <strong>Price:</strong> ${booking.price}
          </div>
          {booking.notes && (
            <div className="info-row">
              <strong>Notes:</strong> {booking.notes}
            </div>
          )}
          {booking.specialRequirements && (
            <div className="info-row special-req">
              <strong>Special Requirements:</strong> {booking.specialRequirements}
            </div>
          )}
        </div>
        
        {booking.status === 'PENDING' && (
          <div className="booking-actions">
            <button 
              onClick={() => handleBookingAction(booking.id, 'accept')}
              className="btn-confirm"
            >
              Accept
            </button>
            <button 
              onClick={() => handleBookingAction(booking.id, 'reject')}
              className="btn-reject"
            >
              Decline
            </button>
          </div>
        )}
        
        {booking.status === 'CONFIRMED' && (
          <div className="booking-actions">
            <button 
              onClick={() => handleBookingAction(booking.id, 'complete')}
              className="btn-complete"
            >
              Mark Complete
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <section className="dashboard-section">
        <h1>Your Bookings</h1>
        <div className="loading-spinner">Loading bookings...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="dashboard-section">
        <h1>Your Bookings</h1>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadBookings} className="retry-button">
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <h1>Your Bookings</h1>
        <div className="header-actions">
          <div className="booking-filters">
            <button 
              className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All ({bookings.length})
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveFilter('pending')}
            >
              Pending ({pendingBookings.length})
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'confirmed' ? 'active' : ''}`}
              onClick={() => setActiveFilter('confirmed')}
            >
              Confirmed ({confirmedBookings.length})
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveFilter('completed')}
            >
              Completed ({completedBookings.length})
            </button>
          </div>
          <button onClick={loadBookings} className="refresh-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="bookings-container">
        {/* Pending Requests Section */}
        {(activeFilter === 'all' || activeFilter === 'pending') && (
          <div className="booking-section">
            <div className="section-title">
              <h2>
                <span className="urgent-indicator">🔔</span>
                Pending Requests ({pendingBookings.length})
              </h2>
              <p className="section-subtitle">New booking requests require your attention</p>
            </div>
            
            {pendingBookings.length > 0 ? (
              <div className="bookings-list">
                {pendingBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} isPending={true} />
                ))}
              </div>
            ) : (
              <div className="no-bookings pending-empty">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h3>No pending requests</h3>
                <p>All caught up! No new booking requests at the moment.</p>
              </div>
            )}
          </div>
        )}

        {/* Confirmed Bookings Section */}
        {(activeFilter === 'all' || activeFilter === 'confirmed') && (
          <div className="booking-section">
            <div className="section-title">
              <h2>
                <span className="confirmed-indicator">✅</span>
                Confirmed Bookings ({confirmedBookings.length})
              </h2>
              <p className="section-subtitle">Upcoming services you've accepted</p>
            </div>
            
            {confirmedBookings.length > 0 ? (
              <div className="bookings-list">
                {confirmedBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            ) : (
              <div className="no-bookings">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <h3>No confirmed bookings</h3>
                <p>No upcoming confirmed services.</p>
              </div>
            )}
          </div>
        )}

        {/* Completed Bookings Section */}
        {(activeFilter === 'all' || activeFilter === 'completed') && (
          <div className="booking-section">
            <div className="section-title">
              <h2>
                <span className="completed-indicator">🏆</span>
                Completed Services ({completedBookings.length})
              </h2>
              <p className="section-subtitle">Your completed work history</p>
            </div>
            
            {completedBookings.length > 0 ? (
              <div className="bookings-list">
                {completedBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            ) : (
              <div className="no-bookings">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h3>No completed services yet</h3>
                <p>Completed services will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* Show all bookings when filter is 'all' and no specific sections above */}
        {activeFilter === 'all' && bookings.length === 0 && (
          <div className="no-bookings">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <h3>No bookings yet</h3>
            <p>Bookings from customers will appear here.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ContractorBookings;