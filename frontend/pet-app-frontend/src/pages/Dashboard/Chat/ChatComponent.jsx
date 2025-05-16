import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Search, Wifi, WifiOff } from 'lucide-react';
import { useChatContext } from '../../../contexts/ChatContext';
import { getCurrentUserId, getUserRole } from '../../../utils/api';
import '../../../styles/ChatComponent.css';

// Chat Header Component
const ChatHeader = ({ totalChats, unreadCount, onNewChat, websocketConnected }) => {
  return (
    <div className="chat-header">
      <div className="chat-header-content">
        <div>
          <h1 className="chat-title">Messages</h1>
          <p className="chat-subtitle">
            {totalChats} conversations {unreadCount > 0 && `• ${unreadCount} unread`}
            {websocketConnected ? (
              <span style={{ color: 'green', marginLeft: '8px' }}>
                <Wifi size={16} />
              </span>
            ) : (
              <span style={{ color: 'red', marginLeft: '8px' }}>
                <WifiOff size={16} />
              </span>
            )}
          </p>
        </div>
        <div className="chat-header-actions">
        
        </div>
      </div>
      
      <div className="chat-search-container">
        <Search className="chat-search-icon" size={18} />
        <input
          type="text"
          placeholder="Search conversations..."
          className="chat-search-input"
        />
      </div>
    </div>
  );
};

// Chat Card Component - updated to work with backend data
const ChatCard = ({ chat, isSelected, onClick, userRole }) => {
  const unreadField = userRole === 'CUSTOMER' ? 'customerUnreadCount' : 'contractorUnreadCount';
  const unreadCount = chat[unreadField] || 0;

  // Format time for display
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return `${Math.floor(diffInHours / 24)} days ago`;
    }
  };

  return (
    <div
      onClick={() => onClick(chat)}
      className={`chat-card ${isSelected ? 'chat-card-selected' : ''}`}
    >
      <div className="chat-card-content">
        <div className="chat-avatar-container">
          <div className="chat-avatar">
            <span className="chat-avatar-text">
              {chat.otherUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          {chat.isOnline && <div className="chat-online-indicator"></div>}
        </div>
        
        <div className="chat-card-info">
          <div className="chat-card-header">
            <h3 className="chat-card-name">{chat.otherUser?.name || 'Unknown User'}</h3>
            <span className="chat-card-time">{formatTime(chat.lastMessageTime)}</span>
          </div>
          
          <p className="chat-card-message">{chat.lastMessage || 'No messages yet'}</p>
          
          <div className="chat-card-footer">
            <div className="chat-card-tags">
              <span className="chat-booking-tag">#{chat.bookingId}</span>
              <span className="chat-service-tag">{chat.serviceName}</span>
            </div>
            {unreadCount > 0 && (
              <span className="chat-unread-badge">{unreadCount}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = ({ userRole }) => {
  return (
    <div className="chat-empty-state">
      <div className="chat-empty-content">
        <div className="chat-empty-icon">
          <MessageCircle size={40} />
        </div>
        <h3 className="chat-empty-title">No conversation selected</h3>
        <p className="chat-empty-text">
          Select a conversation from the list to start chatting with your{' '}
          {userRole === 'CUSTOMER' ? 'service providers' : 'customers'}, or start a new conversation.
        </p>
      </div>
    </div>
  );
};

// Message Bubble Component - updated for backend message format
const MessageBubble = ({ message, isOwnMessage, showTime = true }) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageContent = () => {
    switch (message.messageType) {
      case 'IMAGE':
        return (
          <div>
            {message.attachmentData && (
              <img 
                src={message.attachmentData} 
                alt="Attached image"
                style={{ maxWidth: '100%', borderRadius: '8px' }}
              />
            )}
            {message.content && <p className="message-text">{message.content}</p>}
          </div>
        );
      case 'FILE':
        return (
          <div>
            {message.attachmentFilename && (
              <div className="file-attachment">
                <span>📎 {message.attachmentFilename}</span>
              </div>
            )}
            {message.content && <p className="message-text">{message.content}</p>}
          </div>
        );
      case 'SYSTEM':
        return <p className="message-text system-message">{message.content}</p>;
      default:
        return <p className="message-text">{message.content}</p>;
    }
  };

  return (
    <div className={`message-container ${isOwnMessage ? 'message-own' : 'message-other'}`}>
      <div className="message-bubble-wrapper">
        <div className={`message-bubble ${isOwnMessage ? 'message-bubble-own' : 'message-bubble-other'}`}>
          {renderMessageContent()}
        </div>
        {showTime && (
          <div className={`message-time ${isOwnMessage ? 'message-time-own' : 'message-time-other'}`}>
            <span className="message-timestamp">
              {formatTime(message.createdAt)}
              {isOwnMessage && (
                <span className="message-status">
                  {message.isRead ? '✓✓' : '✓'}
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Chat Conversation Component - integrated with context
const ChatConversation = ({ chat, currentUserId, userRole }) => {
  const { 
    getConversationMessages, 
    sendMessage, 
    sendTypingIndicator,
    typingStatus 
  } = useChatContext();
  
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const messages = getConversationMessages(chat.id) || [];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage(chat.id, newMessage.trim());
      setNewMessage('');
      
      // Stop typing indicator
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Send typing indicator
    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(chat.id);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Check if someone is typing (excluding current user)
  const otherUsersTyping = Object.entries(typingStatus[chat.id] || {})
    .filter(([userId, isTyping]) => userId !== currentUserId && isTyping)
    .map(([userId]) => userId);

  return (
    <div className="chat-conversation">
      {/* Chat Header */}
      <div className="conversation-header">
        <div className="conversation-header-content">
          <div className="conversation-header-info">
            <div className="conversation-avatar">
              <span className="conversation-avatar-text">
                {chat.otherUser?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h2 className="conversation-title">{chat.otherUser?.name || 'Unknown User'}</h2>
              <p className="conversation-subtitle">
                {userRole === 'CUSTOMER' ? 'Service Provider' : 'Customer'} • Booking #{chat.bookingId}
              </p>
            </div>
          </div>
        </div>

        {/* Service Info */}
        <div className="service-info-banner">
          <div className="service-info-content">
            <div>
              <p className="service-name">{chat.serviceName}</p>
              <p className="service-date">
                {chat.serviceDate ? `Scheduled for ${new Date(chat.serviceDate).toLocaleDateString()}` : 'No date set'}
              </p>
            </div>
            <button className="service-details-button">
              View Details
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        <div className="messages-wrapper">
          {messages.length === 0 ? (
            <div className="messages-empty">
              <p>Start the conversation...</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.senderId === currentUserId}
                showTime={index === messages.length - 1 || 
                  messages[index + 1]?.senderId !== message.senderId}
              />
            ))
          )}
          
          {/* Typing indicator */}
          {otherUsersTyping.length > 0 && (
            <div className="typing-indicator">
              <div className="typing-bubble">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="message-input-container">
        <div className="message-input-wrapper">
          <div className="message-input-group">
            <div className="input-with-button">
              <input
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="message-input"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="send-button"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Chat Component - fully integrated with context
const ChatComponent = ({ userRole, currentUserId, currentUserName }) => {
  const { 
    conversations, 
    selectedConversation, 
    selectConversation,
    totalUnreadCount,
    isLoading,
    error,
    websocketConnected 
  } = useChatContext();

  const [searchTerm, setSearchTerm] = useState('');

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(chat =>
    chat.otherUser?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectChat = (chat) => {
    selectConversation(chat);
  };

  const handleNewChat = () => {
    // Handle new chat creation
    console.log('Create new chat');
  };

  if (error) {
    return (
      <div className="chat-component">
        <div className="error-message">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-component">
      <div className="chat-layout">
        {/* Chat List Panel - Always visible */}
        <div className="chat-list-panel">
          <ChatHeader 
            totalChats={conversations.length}
            unreadCount={totalUnreadCount}
            onNewChat={handleNewChat}
            websocketConnected={websocketConnected}
          />
          
          {/* Search Input */}
          <div className="chat-search-container" style={{ padding: '0 1.5rem' }}>
            <Search className="chat-search-icon" size={18} />
            <input
              type="text"
              placeholder="Search conversations..."
              className="chat-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="chat-list-container">
            {isLoading ? (
              <div className="loading-message" style={{ padding: '1rem', textAlign: 'center' }}>
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="no-conversations" style={{ padding: '1rem', textAlign: 'center' }}>
                {searchTerm ? 'No conversations match your search' : 'No conversations yet'}
              </div>
            ) : (
              filteredConversations.map(chat => (
                <ChatCard
                  key={chat.id}
                  chat={chat}
                  isSelected={selectedConversation?.id === chat.id}
                  onClick={handleSelectChat}
                  userRole={userRole}
                />
              ))
            )}
          </div>
        </div>

        {/* Chat Conversation Panel - Always visible */}
        <div className="chat-conversation-panel">
          {selectedConversation ? (
            <ChatConversation
              chat={selectedConversation}
              currentUserId={currentUserId}
              userRole={userRole}
            />
          ) : (
            <EmptyState userRole={userRole} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;