import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, Calendar, Clock, MapPin, DollarSign, User, Wifi, WifiOff } from 'lucide-react';
import {
  createBookingChatConnection,
  sendChatMessage,
  sendTypingIndicator,
  fetchMessages,
  markMessagesAsRead,
  getCurrentUserId,
  getUserRole
} from '../../../utils/api';

const BookingChatComponent = ({
  chatInfo,
  onBack,
  userRole = getUserRole(),
  currentUserId = getCurrentUserId()
}) => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [websocket, setWebsocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (chatInfo && chatInfo.conversationId) {
      initializeChat();
    }

    return () => {
      if (websocket) {
        websocket.close();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatInfo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load existing messages
      const existingMessages = await fetchMessages(chatInfo.conversationId, 0, 50);

      // Format messages for display
      const formattedMessages = existingMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        senderType: msg.senderType,
        type: msg.senderId === parseInt(currentUserId) ? 'sent' : 'received',
        timestamp: new Date(msg.createdAt || msg.sendTime).toLocaleTimeString(),
        messageType: msg.type || 'TEXT'
      }));

      setMessages(formattedMessages.reverse());

      // Mark messages as read
      await markMessagesAsRead(chatInfo.conversationId);

      // Connect WebSocket
      connectWebSocket();

    } catch (err) {
      console.error('Error initializing chat:', err);
      setError('Failed to load chat: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWebSocket = () => {
    try {
      const ws = createBookingChatConnection(
        chatInfo.bookingId,
        chatInfo.conversationId,
        handleWebSocketMessage,
        handleWebSocketError,
        handleWebSocketClose,
        handleParticipantUpdate
      );

      setWebsocket(ws);

      // Handle connection open
      ws.onopen = () => {
        console.log('✅ Chat WebSocket connected for booking:', chatInfo.bookingId);
        setIsConnected(true);
        setError(null);
      };

    } catch (err) {
      console.error('Error connecting WebSocket:', err);
      setError('Failed to connect to chat');
    }
  };

  const handleWebSocketMessage = (message) => {
    console.log('📨 Received message:', message);

    if (message.type === 'TEXT') {
      const newMessage = {
        id: message.messageId || Date.now(),
        content: message.content,
        senderId: message.senderId,
        senderType: message.senderType,
        type: message.senderId === parseInt(currentUserId) ? 'sent' : 'received',
        timestamp: new Date().toLocaleTimeString(),
        messageType: 'TEXT'
      };

      setMessages(prev => [...prev, newMessage]);

    } else if (message.type === 'TYPING_INDICATOR') {
      if (message.senderId !== parseInt(currentUserId)) {
        setTypingUsers(prev => new Set([...prev, message.senderId]));

        // Clear typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => {
            const updated = new Set(prev);
            updated.delete(message.senderId);
            return updated;
          });
        }, 3000);
      }

    } else if (message.type === 'SYSTEM') {
      const systemMessage = {
        id: Date.now(),
        content: message.content,
        type: 'system',
        timestamp: new Date().toLocaleTimeString(),
        messageType: 'SYSTEM'
      };
      setMessages(prev => [...prev, systemMessage]);

    } else if (message.type === 'ERROR') {
      setError(message.content);
    }
  };

  const handleWebSocketError = (error) => {
    console.error('WebSocket error:', error);
    setError('Connection error occurred');
    setIsConnected(false);
  };

  const handleWebSocketClose = (event) => {
    console.log('WebSocket closed:', event.code, event.reason);
    setIsConnected(false);

    // Try to reconnect after 3 seconds if not a normal close
    if (event.code !== 1000) {
      setTimeout(() => {
        console.log('🔄 Attempting to reconnect...');
        connectWebSocket();
      }, 3000);
    }
  };

  const handleParticipantUpdate = (update) => {
    setOnlineUsers(new Set(update.onlineUsers));
    console.log('👥 Participant update:', update);
  };

  const handleSendMessage = () => {
    if (messageText.trim() && websocket && isConnected) {
      const success = sendChatMessage(websocket, chatInfo.conversationId, messageText.trim());
      if (success) {
        setMessageText('');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e) => {
    setMessageText(e.target.value);

    // Send typing indicator occasionally
    if (e.target.value.length % 5 === 1 && websocket && isConnected) {
      sendTypingIndicator(websocket, chatInfo.conversationId);
    }
  };

  const getOtherParticipant = () => {
    if (!chatInfo || !chatInfo.participants || chatInfo.participants.length === 0) {
      return null;
    }
    return chatInfo.participants.find(p => p.id !== parseInt(currentUserId));
  };

  const otherParticipant = getOtherParticipant();
  const bookingInfo = chatInfo?.bookingInfo;

  // Add safety check for chatInfo
  if (!chatInfo) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        backgroundColor: '#f8f9fa',
        color: '#666'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h3>No chat selected</h3>
          <p>Please select a booking to start chatting</p>
          <button
            onClick={onBack}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            Back to Chat List
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        backgroundColor: '#f8f9fa'
      }}>
        <div>Loading chat...</div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>

        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #eee',
          backgroundColor: '#fff'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <button
              onClick={onBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <ArrowLeft size={16} />
              Back to Chats
            </button>

            <div style={{ flex: 1 }}>
              <h1 style={{
                margin: '0',
                fontSize: '20px',
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {bookingInfo?.title}
                {isConnected ? (
                  <Wifi size={18} style={{ color: 'green' }} />
                ) : (
                  <WifiOff size={18} style={{ color: 'red' }} />
                )}
              </h1>

              {otherParticipant && (
                <p style={{
                  margin: '4px 0 0 0',
                  color: '#666',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <User size={14} />
                  Chatting with: <strong>{otherParticipant.name}</strong> ({otherParticipant.role})
                  {onlineUsers.has(otherParticipant.id) && (
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'green',
                      display: 'inline-block',
                      marginLeft: '4px'
                    }} title="Online" />
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Booking Info Bar */}
          {bookingInfo && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '12px',
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} style={{ color: '#007bff' }} />
                <span><strong>Date:</strong> {bookingInfo.date}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} style={{ color: '#007bff' }} />
                <span><strong>Time:</strong> {bookingInfo.time}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={14} style={{ color: '#007bff' }} />
                <span><strong>Price:</strong> {bookingInfo.price}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} style={{ color: '#007bff' }} />
                <span><strong>Status:</strong> {bookingInfo.status}</span>
              </div>
            </div>
          )}
        </div>

        {/* Connection Status */}
        {error && (
          <div style={{
            padding: '12px 20px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderBottom: '1px solid #eee',
            fontSize: '14px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Messages */}
        <div style={{
          height: '500px',
          overflowY: 'auto',
          padding: '16px 20px',
          backgroundColor: '#fafafa'
        }}>
          {messages.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#666',
              padding: '40px 20px',
              fontSize: '14px'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <Calendar size={32} style={{ opacity: 0.3 }} />
              </div>
              <p style={{ margin: '0 0 8px 0' }}>No messages yet for this booking.</p>
              <p style={{ margin: '0', fontSize: '12px' }}>
                Start the conversation about your {bookingInfo?.title} service!
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: message.type === 'sent' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    maxWidth: '70%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor:
                      message.type === 'sent' ? '#007bff' :
                      message.type === 'system' ? '#fff3cd' : '#e9ecef',
                    color:
                      message.type === 'sent' ? 'white' :
                      message.type === 'system' ? '#856404' : '#333',
                    fontSize: '14px',
                    lineHeight: '1.4',
                    wordBreak: 'break-word'
                  }}>
                    {message.type === 'system' && (
                      <div style={{
                        fontSize: '12px',
                        opacity: 0.8,
                        marginBottom: '4px',
                        fontWeight: 'bold'
                      }}>
                        📋 System Message
                      </div>
                    )}

                    <div>{message.content}</div>

                    <div style={{
                      fontSize: '11px',
                      opacity: 0.7,
                      marginTop: '4px',
                      textAlign: message.type === 'sent' ? 'right' : 'left'
                    }}>
                      {message.timestamp}
                      {message.type === 'sent' && (
                        <span style={{ marginLeft: '4px' }}>✓</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {typingUsers.size > 0 && (
                <div style={{
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: 'flex-start'
                }}>
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '12px',
                    backgroundColor: '#e9ecef',
                    color: '#666',
                    fontSize: '13px',
                    fontStyle: 'italic'
                  }}>
                    {otherParticipant?.name} is typing...
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #eee',
          backgroundColor: '#fff'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <textarea
              value={messageText}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={`Type your message about ${bookingInfo?.title || 'this booking'}...`}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #ddd',
                borderRadius: '20px',
                resize: 'none',
                minHeight: '40px',
                maxHeight: '120px',
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || !isConnected}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderRadius: '20px',
                backgroundColor: (!messageText.trim() || !isConnected) ? '#ccc' : '#007bff',
                color: 'white',
                cursor: (!messageText.trim() || !isConnected) ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                transition: 'background-color 0.2s'
              }}
            >
              <Send size={16} />
              Send
            </button>
          </div>

          {/* Input Info */}
          <div style={{
            marginTop: '8px',
            fontSize: '11px',
            color: '#666',
            textAlign: 'center'
          }}>
            {isConnected ? (
              <>
                Press Enter to send •
                {onlineUsers.size > 1 ? ` ${onlineUsers.size} users online` : ' You are online'}
              </>
            ) : (
              '🔄 Reconnecting...'
            )}
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#666'
      }}>
        <details>
          <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
            Debug Info
          </summary>
          <div>
            <strong>Booking ID:</strong> {chatInfo?.bookingId} |
            <strong> Conversation ID:</strong> {chatInfo?.conversationId} |
            <strong> Messages:</strong> {messages.length} |
            <strong> Connected:</strong> {isConnected ? 'Yes' : 'No'} |
            <strong> Participants:</strong> {chatInfo?.participants?.length || 0} |
            <strong> Online:</strong> {onlineUsers.size}
          </div>
        </details>
      </div>
    </div>
  );
};

export default BookingChatComponent;