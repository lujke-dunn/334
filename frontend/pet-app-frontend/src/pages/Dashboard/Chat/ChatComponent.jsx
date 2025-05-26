import React, { useState, useRef, useEffect } from 'react';
import { Send, Wifi, WifiOff } from 'lucide-react';
import { useChatContext } from '../../../contexts/ChatContext';

// Simple Chat Component - like the WebSocket test
const ChatComponent = ({ userRole, currentUserId, currentUserName }) => {
  const {
    messages,
    isConnected,
    error,
    sendMessage,
    sendTyping
  } = useChatContext();

  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      sendMessage(messageText);
      setMessageText('');
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
    if (e.target.value.length % 3 === 0) {
      sendTyping();
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>

        {/* Header */}
        <h1 style={{ margin: '0 0 20px 0', color: '#333' }}>
          Pet Service Chat
          {isConnected ? (
            <Wifi size={24} style={{ color: 'green', marginLeft: '10px' }} />
          ) : (
            <WifiOff size={24} style={{ color: 'red', marginLeft: '10px' }} />
          )}
        </h1>

        {/* Connection Status */}
        <div style={{
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '20px',
          fontWeight: 'bold',
          backgroundColor: isConnected ? '#d4edda' : '#f8d7da',
          color: isConnected ? '#155724' : '#721c24'
        }}>
          {isConnected ? 'Connected' : 'Disconnected'}
          {error && ` - ${error}`}
        </div>

        {/* Messages */}
        <div style={{
          height: '400px',
          overflowY: 'auto',
          border: '1px solid #ddd',
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: '#fafafa'
        }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
              No messages yet. Start chatting!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                style={{
                  marginBottom: '10px',
                  padding: '8px',
                  borderRadius: '4px',
                  backgroundColor:
                    message.type === 'sent' ? '#007bff' :
                    message.type === 'system' ? '#fff3cd' : '#e9ecef',
                  color:
                    message.type === 'sent' ? 'white' :
                    message.type === 'system' ? '#856404' : '#333',
                  textAlign: message.type === 'sent' ? 'right' : 'left',
                  fontStyle: message.type === 'system' ? 'italic' : 'normal'
                }}
              >
                <span style={{ fontSize: '12px', opacity: 0.7 }}>
                  [{message.timestamp}]
                </span>
                {message.content}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <textarea
            value={messageText}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            style={{
              flex: 1,
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              resize: 'vertical',
              minHeight: '60px',
              fontFamily: 'Arial, sans-serif'
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || !isConnected}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: (!messageText.trim() || !isConnected) ? '#ccc' : '#007bff',
              color: 'white',
              cursor: (!messageText.trim() || !isConnected) ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Send size={18} />
            Send
          </button>
        </div>

        {/* Debug Info */}
        <div style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#666'
        }}>
          <strong>Debug:</strong> User {currentUserId} ({userRole}) |
          Messages: {messages.length} |
          Connected: {isConnected ? 'Yes' : 'No'}
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;