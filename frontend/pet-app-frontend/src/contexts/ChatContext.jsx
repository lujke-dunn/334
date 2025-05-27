import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  createWebSocketConnection,
  sendChatMessage,
  sendTypingIndicator,
  getCurrentUserId,
  getUserRole
} from '../utils/api';

// Create the context
const ChatContext = createContext();

// Simple Chat Provider - like the test
export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const websocketRef = useRef(null);

  // Current user info
  const currentUserId = parseInt(getCurrentUserId());
  const userRole = getUserRole();

  // WebSocket message handler - simplified like the test
  const handleWebSocketMessage = (wsMessage) => {
    console.log('📨 Received message:', wsMessage);

    try {
      if (wsMessage.type === 'SYSTEM') {
        addMessage(`🔔 System: ${wsMessage.content}`, 'system');
      } else if (wsMessage.type === 'ERROR') {
        addMessage(`❌ Error: ${wsMessage.content}`, 'system');
        setError(wsMessage.content);
      } else if (wsMessage.type === 'TEXT' || wsMessage.type === 'IMAGE' || wsMessage.type === 'FILE') {
        const isOwnMessage = wsMessage.senderId === currentUserId;
        const messageText = `${wsMessage.senderType} (${wsMessage.senderId}): ${wsMessage.content}`;
        addMessage(messageText, isOwnMessage ? 'sent' : 'received');
      }
    } catch (error) {
      console.error('Error handling message:', error);
      addMessage(`Raw: ${JSON.stringify(wsMessage)}`, 'received');
    }
  };

  // WebSocket error handler
  const handleWebSocketError = (error) => {
    console.error('❌ WebSocket error:', error);
    setError('Connection error');
    setIsConnected(false);
  };

  // WebSocket close handler
  const handleWebSocketClose = (event) => {
    console.log('🔌 WebSocket closed:', event.code);
    setIsConnected(false);

    if (event.code === 1006) {
      addMessage('💡 Connection failed - server may not be running', 'system');
    }

    // Try to reconnect after 3 seconds
    setTimeout(() => {
      if (!websocketRef.current || websocketRef.current.readyState === WebSocket.CLOSED) {
        connectWebSocket();
      }
    }, 3000);
  };

  // Connect to WebSocket - simplified
  const connectWebSocket = () => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      websocketRef.current = createWebSocketConnection(
        handleWebSocketMessage,
        handleWebSocketError,
        handleWebSocketClose
      );

      websocketRef.current.onopen = () => {
        console.log('✅ Connected!');
        setIsConnected(true);
        setError(null);
        addMessage('✅ Connected to chat!', 'system');
      };
    } catch (error) {
      console.error('Failed to connect:', error);
      handleWebSocketError(error);
    }
  };

  // Add message to list - like the test
  const addMessage = (content, type = 'received') => {
    const newMessage = {
      id: Date.now(),
      content,
      type,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, newMessage]);
  };


  const sendMessage = (messageText) => {
    if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
      addMessage('Not connected to WebSocket', 'system');
      return false;
    }

    if (!messageText.trim()) {
      addMessage('Please enter a message', 'system');
      return false;
    }

    // Use conversation ID 1 (same as test)
    const success = sendChatMessage(websocketRef.current, 1, messageText.trim());

    if (success) {
      addMessage(`You: ${messageText.trim()}`, 'sent');
      return true;
    } else {
      addMessage('Failed to send message', 'system');
      return false;
    }
  };

  // Send typing indicator
  const sendTyping = () => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      sendTypingIndicator(websocketRef.current, 1);
    }
  };

  // Connect on mount
  useEffect(() => {
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  const value = {
    messages,
    isConnected,
    error,
    sendMessage,
    sendTyping,
    connectWebSocket,
    currentUserId,
    userRole
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use chat context
export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;