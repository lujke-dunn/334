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
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '380px',
        backgroundColor: 'white',
        boxShadow: '2px 0 10px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          backgroundColor: '#2c3e50',
          color: 'white'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '24px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <MessageCircle size={28} />
            Pet Service Chats
          </h2>
          <div style={{ 
            fontSize: '14px', 
            marginTop: '8px', 
            opacity: 0.9,
            fontWeight: '300'
          }}>
            {userRole} • {bookings.length} active conversations
          </div>
        </div>

        {/* Booking List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <RefreshCw size={28} className="spinning" style={{ color: '#28a745' }} />
              <p style={{ marginTop: '16px', color: '#666' }}>Loading bookings...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#d32f2f' }}>
              <p>{error}</p>
              <button onClick={loadBookings} style={{
                marginTop: '10px',
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}>
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
              <button onClick={loadBookings} style={{
                marginTop: '20px',
                padding: '10px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}>
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
                    padding: '16px 20px',
                    margin: '12px 16px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    backgroundColor: selectedBooking?.id === booking.id 
                      ? '#f0f8ff' 
                      : 'white',
                    boxShadow: selectedBooking?.id === booking.id 
                      ? '0 4px 12px rgba(0, 0, 0, 0.1)' 
                      : '0 2px 8px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease',
                    border: selectedBooking?.id === booking.id 
                      ? '2px solid #28a745' 
                      : '2px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedBooking?.id !== booking.id) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedBooking?.id !== booking.id) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#f97316',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: '600'
                    }}>
                      {otherParty?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: '600',
                        fontSize: '16px',
                        color: '#1e293b',
                        marginBottom: '4px'
                      }}>{otherParty}</div>
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>{booking.serviceName}</span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: booking.status === 'CONFIRMED' ? '#dbeafe' :
                                         booking.status === 'IN_PROGRESS' ? '#fef3c7' :
                                         booking.status === 'COMPLETED' ? '#d1fae5' : '#f3f4f6',
                          color: booking.status === 'CONFIRMED' ? '#1e40af' :
                                booking.status === 'IN_PROGRESS' ? '#92400e' :
                                booking.status === 'COMPLETED' ? '#065f46' : '#374151'
                        }}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    marginTop: '12px', 
                    fontSize: '13px', 
                    color: '#94a3b8',
                    display: 'flex',
                    gap: '20px',
                    paddingLeft: '62px'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} style={{ opacity: 0.7 }} />
                      {new Date(booking.startTime).toLocaleDateString()}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} style={{ opacity: 0.7 }} />
                      {new Date(booking.startTime).toLocaleTimeString([], { 
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
        <div style={{ 
          flex: 1, 
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}>
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
          backgroundColor: '#f8f9fa',
          position: 'relative'
        }}>
          
          <div style={{ 
            textAlign: 'center', 
            padding: '60px',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              margin: '0 auto 32px',
              borderRadius: '50%',
              backgroundColor: '#28a745',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(40, 167, 69, 0.2)'
            }}>
              <MessageCircle size={60} style={{ 
                color: 'white'
              }} />
            </div>
            <h2 style={{ 
              margin: '0 0 16px 0', 
              color: '#1e293b',
              fontSize: '32px',
              fontWeight: '700',
              letterSpacing: '-0.5px'
            }}>
              Welcome to Pet Service Chat
            </h2>
            <p style={{ 
              color: '#64748b', 
              fontSize: '18px',
              lineHeight: '1.6',
              maxWidth: '400px',
              margin: '0 auto'
            }}>
              Select a booking from the sidebar to start a conversation with your {userRole === 'CUSTOMER' ? 'service provider' : 'customer'}
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