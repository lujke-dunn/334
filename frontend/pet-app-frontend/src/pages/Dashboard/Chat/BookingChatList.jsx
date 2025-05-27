import React, { useState, useEffect } from 'react';
import { MessageCircle, Calendar, Clock, MapPin, DollarSign, User, Bell } from 'lucide-react';
import {
  getBookingChatList,
  startBookingChat,
  formatBookingForChat,
  canAccessBookingChat,
  getCurrentUserId,
  getUserRole,
  fetchBookings,
  fetchContractorBookings,
  getConversationByBookingId
} from '../../../utils/api';

const BookingChatList = ({ onSelectChat }) => {
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  useEffect(() => {
    loadChatList();
  }, []);

  const loadChatList = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Loading bookings for chat...');
      console.log('👤 Current user:', getCurrentUserId(), getUserRole());

      const userRole = getUserRole();
      console.log('📋 Getting bookings for role:', userRole);

      // Get all bookings directly
      let bookingsResult;
      try {
        if (userRole === 'CUSTOMER') {
          bookingsResult = await fetchBookings(0, 20);
        } else {
          bookingsResult = await fetchContractorBookings(0, 20);
        }
        console.log('📦 Bookings result:', bookingsResult);
      } catch (bookingError) {
        console.error('❌ Error fetching bookings:', bookingError);
        setError('Failed to load bookings: ' + bookingError.message);
        return;
      }

      // Extract bookings from result (could be paginated or direct array)
      const bookings = bookingsResult.content || bookingsResult || [];
      console.log('📚 Total bookings found:', bookings.length);

      // Filter for chat-eligible bookings (CONFIRMED, IN_PROGRESS, COMPLETED)
      const eligibleBookings = bookings.filter(booking => 
        ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status)
      );
      console.log('✅ Eligible bookings for chat:', eligibleBookings.length);

      // For each eligible booking, check if it has a conversation
      const bookingsWithChatInfo = await Promise.all(
        eligibleBookings.map(async (booking) => {
          try {
            // Try to get existing conversation
            const conversation = await getConversationByBookingId(booking.id);
            
            return {
              booking: booking,
              hasChat: !!conversation,
              canCreateChat: !conversation && booking.status === 'CONFIRMED',
              conversation: conversation,
              conversationId: conversation?.id || null,
              unreadCount: conversation ? (
                userRole === 'CUSTOMER' 
                  ? conversation.customerUnreadCount || 0
                  : conversation.contractorUnreadCount || 0
              ) : 0,
              lastMessage: null, // Will be populated if needed
              lastActivity: conversation?.lastMessageTime || null,
              otherParticipant: {
                id: userRole === 'CUSTOMER' ? booking.contractorId : booking.customerId,
                name: userRole === 'CUSTOMER' ? booking.contractorName : booking.customerName,
                role: userRole === 'CUSTOMER' ? 'CONTRACTOR' : 'CUSTOMER'
              }
            };
          } catch (error) {
            console.warn(`Could not check conversation for booking ${booking.id}:`, error);
            // Even if we can't check for conversation, still show the booking
            return {
              booking: booking,
              hasChat: false,
              canCreateChat: booking.status === 'CONFIRMED',
              conversation: null,
              conversationId: null,
              unreadCount: 0,
              lastMessage: null,
              lastActivity: null,
              otherParticipant: {
                id: userRole === 'CUSTOMER' ? booking.contractorId : booking.customerId,
                name: userRole === 'CUSTOMER' ? booking.contractorName : booking.customerName,
                role: userRole === 'CUSTOMER' ? 'CONTRACTOR' : 'CUSTOMER'
              }
            };
          }
        })
      );

      console.log('💬 Bookings with chat info:', bookingsWithChatInfo);
      setChatList(bookingsWithChatInfo);

      if (bookingsWithChatInfo.length === 0) {
        console.warn('⚠️ No eligible bookings found for chat');
        if (bookings.length > 0) {
          console.warn('📋 Total bookings:', bookings.length);
          console.warn('🚫 But none are CONFIRMED, IN_PROGRESS, or COMPLETED');
        }
      }

    } catch (err) {
      console.error('❌ Error loading bookings:', err);
      setError('Failed to load bookings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChat = async (booking) => {
    try {
      setSelectedBookingId(booking.id);

      if (!canAccessBookingChat(booking)) {
        alert('You cannot access this chat');
        return;
      }

      console.log('🔄 Starting chat for booking:', booking.id);
      const chatInfo = await startBookingChat(booking.id);

      console.log('✅ Chat info received:', chatInfo);

      // Ensure we have all required data
      if (!chatInfo || !chatInfo.conversationId) {
        throw new Error('Failed to get conversation information');
      }

      // Call parent component with complete chat info
      onSelectChat({
        bookingId: booking.id,
        conversationId: chatInfo.conversationId,
        participants: chatInfo.participants || [],
        booking: booking,
        bookingInfo: formatBookingForChat(booking),
        conversation: chatInfo.conversation
      });

    } catch (err) {
      console.error('Error starting chat:', err);
      alert('Failed to start chat: ' + err.message);
    } finally {
      setSelectedBookingId(null);
    }
  };

  const getUserRole = () => {
    return localStorage.getItem('userRole') || 'CUSTOMER';
  };

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <div>Loading your chats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <div>{error}</div>
        <button
          onClick={loadChatList}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #eee',
          backgroundColor: '#fff'
        }}>
          <h1 style={{
            margin: '0 0 10px 0',
            color: '#333',
            fontSize: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <MessageCircle size={24} />
            Your Booking Chats
          </h1>
          <p style={{
            margin: '0',
            color: '#666',
            fontSize: '14px'
          }}>
            Chat with {getUserRole() === 'CUSTOMER' ? 'contractors' : 'customers'} about your confirmed bookings
          </p>
        </div>

        {/* Chat List */}
        {chatList.length === 0 ? (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#666'
          }}>
            <MessageCircle size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>No bookings available for chat</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px' }}>
              You can start chatting when you have bookings with status: CONFIRMED, IN_PROGRESS, or COMPLETED
            </p>
            <p style={{ margin: '0', fontSize: '13px', color: '#999' }}>
              {getUserRole() === 'CUSTOMER' 
                ? 'Create a booking and wait for the contractor to accept it'
                : 'Accept a booking request to start chatting with customers'}
            </p>

            {/* Debug Info */}
            <details style={{
              marginTop: '20px',
              textAlign: 'left',
              backgroundColor: '#f8f9fa',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                🔍 Debug Information
              </summary>
              <div style={{ marginTop: '8px' }}>
                <p><strong>User ID:</strong> {getCurrentUserId()}</p>
                <p><strong>User Role:</strong> {getUserRole()}</p>
                <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
                <p><strong>Error:</strong> {error || 'None'}</p>
                <p><strong>Chat List Length:</strong> {chatList.length}</p>

                <button
                  onClick={async () => {
                    console.log('🧪 Testing direct booking fetch...');
                    try {
                      const userRole = getUserRole();
                      let bookings;
                      if (userRole === 'CUSTOMER') {
                        bookings = await fetchBookings(0, 5);
                      } else {
                        bookings = await fetchContractorBookings(0, 5);
                      }
                      console.log('📋 Direct bookings result:', bookings);
                      alert(`Found ${bookings?.length || bookings?.content?.length || 0} bookings. Check console for details.`);
                    } catch (err) {
                      console.error('❌ Direct booking test failed:', err);
                      alert('Failed to fetch bookings: ' + err.message);
                    }
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Test Direct Booking Fetch
                </button>
              </div>
            </details>
          </div>
        ) : (
          <div>
            {chatList.map((chat) => {
              const bookingInfo = formatBookingForChat(chat.booking);
              const isSelected = selectedBookingId === chat.booking.id;

              return (
                <div
                  key={chat.booking.id}
                  onClick={() => handleSelectChat(chat.booking)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #eee',
                    cursor: isSelected ? 'wait' : 'pointer',
                    backgroundColor: isSelected ? '#f0f8ff' : 'transparent',
                    transition: 'background-color 0.2s',
                    opacity: isSelected ? 0.7 : 1,
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.target.style.backgroundColor = '#f8f9fa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.target.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {/* Chat Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        margin: '0 0 4px 0',
                        fontSize: '16px',
                        color: '#333',
                        fontWeight: '600'
                      }}>
                        {bookingInfo.title}
                      </h3>

                      {chat.otherParticipant && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '14px',
                          color: '#666',
                          marginBottom: '4px'
                        }}>
                          <User size={14} />
                          <span>
                            {getUserRole() === 'CUSTOMER' ? 'Contractor' : 'Customer'}: {chat.otherParticipant.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Unread Badge */}
                    {chat.unreadCount > 0 && (
                      <div style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        borderRadius: '12px',
                        padding: '2px 8px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        minWidth: '20px',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Bell size={12} />
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>

                  {/* Booking Info */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      color: '#666'
                    }}>
                      <Calendar size={12} />
                      <span>{bookingInfo.date}</span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      color: '#666'
                    }}>
                      <Clock size={12} />
                      <span>{bookingInfo.time}</span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      color: '#666'
                    }}>
                      <DollarSign size={12} />
                      <span>{bookingInfo.price}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '8px'
                  }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      backgroundColor:
                        chat.booking.status === 'CONFIRMED' ? '#d4edda' :
                        chat.booking.status === 'IN_PROGRESS' ? '#cce5ff' :
                        chat.booking.status === 'COMPLETED' ? '#d1ecf1' : '#f8d7da',
                      color:
                        chat.booking.status === 'CONFIRMED' ? '#155724' :
                        chat.booking.status === 'IN_PROGRESS' ? '#004085' :
                        chat.booking.status === 'COMPLETED' ? '#0c5460' : '#721c24'
                    }}>
                      {chat.booking.status}
                    </span>

                    {/* Last Activity */}
                    {chat.lastActivity && (
                      <span style={{
                        fontSize: '11px',
                        color: '#999'
                      }}>
                        Last activity: {new Date(chat.lastActivity).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Last Message Preview */}
                  {chat.lastMessage && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#666',
                      fontStyle: 'italic'
                    }}>
                      Last message: "{chat.lastMessage.content?.substring(0, 60)}
                      {chat.lastMessage.content?.length > 60 ? '...' : ''}"
                    </div>
                  )}

                  {/* Chat Actions */}
                  {!chat.hasChat && chat.canCreateChat && (
                    <div style={{
                      marginTop: '8px',
                      padding: '6px 12px',
                      backgroundColor: '#e7f3ff',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#0066cc',
                      textAlign: 'center'
                    }}>
                      Click to start chat
                    </div>
                  )}

                  {/* Loading indicator */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      right: '20px',
                      transform: 'translateY(-50%)',
                      fontSize: '12px',
                      color: '#007bff'
                    }}>
                      Opening chat...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#f8f9fa',
          borderTop: '1px solid #eee',
          fontSize: '12px',
          color: '#666',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Total chats: {chatList.length}</span>
            <button
              onClick={loadChatList}
              style={{
                padding: '4px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Refresh
            </button>
            <span>
              Unread: {chatList.reduce((sum, chat) => sum + chat.unreadCount, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingChatList;