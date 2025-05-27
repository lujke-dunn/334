import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Calendar, Clock, MapPin, DollarSign, User, AlertCircle } from 'lucide-react';
import {
  fetchMessages,
  createWebSocketConnection,
  sendChatMessage,
  getCurrentUserId,
  getUserRole,
  getOrCreateBookingConversation,
  markMessagesAsRead
} from '../../../utils/api';

const ChatComponent = ({ 
  booking, 
  onBack 
}) => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [websocket, setWebsocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const messagesEndRef = useRef(null);
  const currentUserId = getCurrentUserId();
  const userRole = getUserRole();

  // Initialize chat when booking changes
  useEffect(() => {
    console.log('ChatComponent received booking:', booking);
    if (booking && booking.id) {
      initializeChat();
    }
    
    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [booking]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessages([]);
      
      console.log('Initializing chat for booking:', booking.id);

      // Get or create conversation
      let conv = await getOrCreateBookingConversation(booking.id);
      console.log('Conversation:', conv);
      setConversation(conv);

      // Load existing messages
      try {
        const existingMessages = await fetchMessages(conv.id, 0, 50);
        console.log('Loaded messages:', existingMessages.length);
        
        const formatted = existingMessages.map(msg => {
          console.log('Message senderId:', msg.senderId, 'currentUserId:', currentUserId, 'isEqual:', msg.senderId === currentUserId);
          return {
            id: msg.id,
            content: msg.content,
            senderId: msg.senderId,
            timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOwnMessage: msg.senderId === currentUserId
          };
        });
        
        setMessages(formatted.reverse());
      } catch (err) {
        console.warn('Could not load messages:', err);
      }

      // Mark messages as read
      try {
        await markMessagesAsRead(conv.id);
      } catch (err) {
        console.warn('Could not mark messages as read:', err);
      }

      // Connect WebSocket
      connectWebSocket(conv.id);

    } catch (err) {
      console.error('Error initializing chat:', err);
      setError('Failed to load chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = (conversationId) => {
    try {
      const ws = createWebSocketConnection(
        handleWebSocketMessage,
        handleWebSocketError,
        handleWebSocketClose,
        conversationId,
        currentUserId
      );

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      setWebsocket(ws);
    } catch (err) {
      console.error('WebSocket connection error:', err);
      setIsConnected(false);
    }
  };

  const handleWebSocketMessage = (message) => {
    console.log('Received message:', message);
    
    if (message.type === 'TEXT') {
      // Use message timestamp if available, otherwise create new one
      let messageTime;
      try {
        if (message.timestamp || message.createdAt) {
          messageTime = new Date(message.timestamp || message.createdAt);
          if (isNaN(messageTime.getTime())) {
            messageTime = new Date();
          }
        } else {
          messageTime = new Date();
        }
      } catch (e) {
        console.warn('Invalid timestamp, using current time:', e);
        messageTime = new Date();
      }
      
      const newMessage = {
        id: message.messageId || Date.now(),
        content: message.content,
        senderId: message.senderId,
        timestamp: messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwnMessage: String(message.senderId) === String(currentUserId)
      };
      
      setMessages(prev => [...prev, newMessage]);
    }
  };

  const handleWebSocketError = (error) => {
    console.error('WebSocket error:', error);
    setIsConnected(false);
  };

  const handleWebSocketClose = () => {
    console.log('WebSocket closed');
    setIsConnected(false);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim() || !conversation || sending) return;

    setSending(true);
    const msgContent = messageText.trim();
    setMessageText('');

    try {
      // Try WebSocket first
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        const success = sendChatMessage(websocket, conversation.id, msgContent);
        if (!success) {
          throw new Error('WebSocket send failed');
        }
      } else {
        // Fallback to REST API
        const response = await fetch(`http://localhost:8084/api/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: conversation.id,
            senderId: currentUserId,
            content: msgContent,
            messageType: 'TEXT',
            userType: userRole.toUpperCase()
          })
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        // Add message to UI for REST API sends
        const newMessage = {
          id: Date.now(),
          content: msgContent,
          senderId: currentUserId,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOwnMessage: true
        };
        
        setMessages(prev => [...prev, newMessage]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      setMessageText(msgContent); // Restore message
    } finally {
      setSending(false);
    }
  };

  if (!booking) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>No booking selected</p>
        <button onClick={onBack}>Go Back</button>
      </div>
    );
  }

  const otherPartyName = userRole === 'CUSTOMER' ? booking.contractorName : booking.customerName;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f8fafc'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
        padding: '20px 24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onBack}
            style={{
              padding: '10px 16px',
              border: '1px solid #dee2e6',
              backgroundColor: '#f8f9fa',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#495057',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
            }}
          >
            <ArrowLeft size={18} />
            Back
          </button>
          
          <div style={{ 
            width: '1px', 
            height: '40px', 
            backgroundColor: '#e5e7eb' 
          }} />
          
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e293b'
            }}>{otherPartyName}</h3>
            <p style={{ 
              margin: '4px 0 0 0', 
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
            </p>
          </div>

          <div style={{ 
            textAlign: 'right', 
            fontSize: '13px', 
            color: '#64748b',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
              <Calendar size={14} /> 
              {new Date(booking.startTime).toLocaleDateString()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
              <Clock size={14} /> 
              {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        background: 'linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%)'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading messages...</p>
          </div>
        ) : error ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            backgroundColor: '#fee',
            borderRadius: '8px',
            color: '#c00'
          }}>
            <AlertCircle size={24} style={{ marginBottom: '10px' }} />
            <p>{error}</p>
            <button 
              onClick={initializeChat}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#c00',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              style={{
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.isOwnMessage ? 'flex-end' : 'flex-start'
              }}
            >
              {!msg.isOwnMessage && (
                <div style={{
                  fontSize: '12px',
                  color: '#64748b',
                  marginBottom: '4px',
                  paddingLeft: '4px'
                }}>
                  {otherPartyName}
                </div>
              )}
              <div style={{
                maxWidth: '70%',
                padding: '12px 18px',
                borderRadius: msg.isOwnMessage ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                backgroundColor: msg.isOwnMessage 
                  ? '#f97316' 
                  : 'white',
                color: msg.isOwnMessage ? 'white' : '#1e293b',
                boxShadow: msg.isOwnMessage 
                  ? '0 4px 12px rgba(249, 115, 22, 0.3)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}>
                <div style={{ 
                  fontSize: '15px',
                  lineHeight: '1.5',
                  wordBreak: 'break-word'
                }}>{msg.content}</div>
                <div style={{
                  fontSize: '12px',
                  color: msg.isOwnMessage ? 'rgba(255, 255, 255, 0.8)' : '#94a3b8',
                  marginTop: '4px',
                  textAlign: 'right'
                }}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} style={{
        padding: '20px 24px',
        backgroundColor: 'white',
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type your message..."
          disabled={sending || loading}
          style={{
            flex: 1,
            padding: '12px 20px',
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            outline: 'none',
            fontSize: '15px',
            transition: 'all 0.2s ease',
            backgroundColor: '#f8fafc'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#667eea';
            e.target.style.backgroundColor = '#ffffff';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e5e7eb';
            e.target.style.backgroundColor = '#f8fafc';
          }}
        />
        <button
          type="submit"
          disabled={!messageText.trim() || sending || loading}
          style={{
            padding: '12px',
            background: messageText.trim() && !sending && !loading 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
              : '#e5e7eb',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: messageText.trim() && !sending && !loading ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            boxShadow: messageText.trim() && !sending && !loading 
              ? '0 4px 12px rgba(102, 126, 234, 0.3)' 
              : 'none'
          }}
          onMouseEnter={(e) => {
            if (messageText.trim() && !sending && !loading) {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = messageText.trim() && !sending && !loading 
              ? '0 4px 12px rgba(102, 126, 234, 0.3)' 
              : 'none';
          }}
        >
          <Send size={22} />
        </button>
      </form>

      {/* Connection Status */}
      {!loading && (
        <div style={{
          padding: '8px',
          background: isConnected 
            ? 'linear-gradient(90deg, #d1fae5 0%, #a7f3d0 100%)' 
            : 'linear-gradient(90deg, #fee2e2 0%, #fecaca 100%)',
          color: isConnected ? '#065f46' : '#991b1b',
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isConnected ? '#10b981' : '#ef4444',
            boxShadow: isConnected 
              ? '0 0 8px rgba(16, 185, 129, 0.6)' 
              : '0 0 8px rgba(239, 68, 68, 0.6)'
          }} />
          {isConnected ? 'Connected' : 'Disconnected (messages will still send)'}
        </div>
      )}
    </div>
  );
};

export default ChatComponent;