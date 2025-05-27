import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, User, Calendar, Clock, RefreshCw, Search } from 'lucide-react';
import ChatComponent from './ChatComponent';
import { getAccessToken } from '../../../utils/api';

const SimpleChatApp = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get user info from localStorage
  const userRole = localStorage.getItem('userRole') || 'CUSTOMER';

  useEffect(() => {
    loadBookings();
    
    // Set up polling for new bookings (check every 30 seconds)
    const interval = setInterval(loadBookings, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Use the exact same loading logic as ContractorBookings and CustomerBookings
  const loadBookings = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        console.log('No access token available');
        setError('Please log in to view chats');
        setLoading(false);
        return;
      }

      // Use the same endpoints as the booking pages
      const endpoint = userRole === 'CUSTOMER' 
        ? 'http://localhost:8083/api/bookings/customer'
        : 'http://localhost:8083/api/bookings/contractor';

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded bookings:', data);
        
        // Use the same data extraction as the booking pages
        const bookingsList = data.content || data;
        
        // Filter for chat-eligible bookings
        const chatEligible = bookingsList.filter(booking => 
          ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status)
        );
        
        setBookings(chatEligible);
        setError(null);
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

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '350px',
        backgroundColor: 'white',
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          backgroundColor: '#075E54',
          color: 'white'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>
            <MessageCircle size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Pet Service Chats
          </h2>
          <div style={{ fontSize: '14px', marginTop: '5px', opacity: 0.9 }}>
            {userRole} • {bookings.length} chats available
          </div>
        </div>

        {/* Booking List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <RefreshCw size={24} className="spinning" style={{ color: '#999' }} />
              <p>Loading bookings...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#d32f2f' }}>
              <p>{error}</p>
              <button onClick={fetchBookings} style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#075E54',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Retry
              </button>
            </div>
          ) : bookings.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#666' }}>
              <MessageCircle size={48} style={{ opacity: 0.3, marginBottom: '10px' }} />
              <p style={{ fontWeight: 'bold' }}>No eligible bookings</p>
              <p style={{ fontSize: '14px' }}>
                Only CONFIRMED, IN_PROGRESS, or COMPLETED bookings can have chats
              </p>
              <button onClick={fetchBookings} style={{
                marginTop: '20px',
                padding: '8px 16px',
                backgroundColor: '#075E54',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Refresh
              </button>
            </div>
          ) : (
            bookings.map(booking => {
              const otherParty = userRole === 'CUSTOMER' 
                ? booking.contractorName 
                : booking.customerName;
              
              return (
                <div
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  style={{
                    padding: '15px 20px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    backgroundColor: selectedBooking?.id === booking.id ? '#f5f5f5' : 'white',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedBooking?.id !== booking.id) {
                      e.currentTarget.style.backgroundColor = '#fafafa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedBooking?.id !== booking.id) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#075E54',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}>
                      {otherParty?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600' }}>{otherParty}</div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {booking.serviceName} • {booking.status}
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    marginTop: '8px', 
                    fontSize: '12px', 
                    color: '#999',
                    display: 'flex',
                    gap: '15px'
                  }}>
                    <span>
                      <Calendar size={12} style={{ verticalAlign: 'middle' }} />
                      {' '}{new Date(booking.startTime).toLocaleDateString()}
                    </span>
                    <span>
                      <Clock size={12} style={{ verticalAlign: 'middle' }} />
                      {' '}{new Date(booking.startTime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedBooking ? (
        <div style={{ flex: 1, position: 'relative' }}>
          <ChatComponent 
            booking={selectedBooking}
            onBack={() => setSelectedBooking(null)}
          />
        </div>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <MessageCircle size={80} style={{ color: '#075E54', opacity: 0.5, marginBottom: '20px' }} />
            <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>
              Welcome to Pet Service Chat
            </h2>
            <p style={{ color: '#666', fontSize: '16px' }}>
              Select a booking from the sidebar to start chatting
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default SimpleChatApp;