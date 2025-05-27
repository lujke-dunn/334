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
  const currentUserId = parseInt(getCurrentUserId());
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
        
        const formatted = existingMessages.map(msg => ({
          id: msg.id,
          content: msg.content,
          senderId: msg.senderId,
          timestamp: new Date(msg.createdAt).toLocaleTimeString(),
          isOwnMessage: msg.senderId === currentUserId
        }));
        
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
      const newMessage = {
        id: message.messageId || Date.now(),
        content: message.content,
        senderId: message.senderId,
        timestamp: new Date().toLocaleTimeString(),
        isOwnMessage: message.senderId === currentUserId
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
          timestamp: new Date().toLocaleTimeString(),
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
      backgroundColor: '#f5f5f5'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '15px 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={onBack}
            style={{
              padding: '8px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: '#666'
            }}
          >
            <ArrowLeft size={20} />
            Back
          </button>
          
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>{otherPartyName}</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '14px', color: '#666' }}>
              {booking.serviceName} • {booking.status}
            </p>
          </div>

          <div style={{ textAlign: 'right', fontSize: '13px', color: '#666' }}>
            <div><Calendar size={12} style={{ verticalAlign: 'middle' }} /> {new Date(booking.startTime).toLocaleDateString()}</div>
            <div><Clock size={12} style={{ verticalAlign: 'middle' }} /> {new Date(booking.startTime).toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        backgroundColor: '#e5ddd5'
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
                marginBottom: '10px',
                display: 'flex',
                justifyContent: msg.isOwnMessage ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '70%',
                padding: '10px 15px',
                borderRadius: '18px',
                backgroundColor: msg.isOwnMessage ? '#DCF8C6' : 'white',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                <div>{msg.content}</div>
                <div style={{
                  fontSize: '11px',
                  color: '#999',
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
        padding: '15px',
        backgroundColor: 'white',
        borderTop: '1px solid #e0e0e0',
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message..."
          disabled={sending || loading}
          style={{
            flex: 1,
            padding: '10px 15px',
            border: '1px solid #e0e0e0',
            borderRadius: '25px',
            outline: 'none',
            fontSize: '14px'
          }}
        />
        <button
          type="submit"
          disabled={!messageText.trim() || sending || loading}
          style={{
            padding: '10px',
            backgroundColor: messageText.trim() && !sending && !loading ? '#075E54' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: messageText.trim() && !sending && !loading ? 'pointer' : 'not-allowed'
          }}
        >
          <Send size={20} />
        </button>
      </form>

      {/* Connection Status */}
      {!loading && (
        <div style={{
          padding: '5px',
          backgroundColor: isConnected ? '#d4edda' : '#f8d7da',
          color: isConnected ? '#155724' : '#721c24',
          textAlign: 'center',
          fontSize: '12px'
        }}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected (messages will still send)'}
        </div>
      )}
    </div>
  );
};

export default ChatComponent;