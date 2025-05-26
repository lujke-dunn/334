import React from 'react';
import { ChatProvider } from '../../contexts/ChatContext';
import ChatComponent from './ChatComponent';
import { getCurrentUserId, getCurrentUserName, getUserRole } from '../../utils/api';

// Simple Chat App - like the test interface
const ChatApp = () => {
  const currentUserId = getCurrentUserId();
  const currentUserName = getCurrentUserName();
  const userRole = getUserRole();

  // Simple authentication check
  if (!currentUserId || !userRole) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '50px auto',
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        borderRadius: '8px'
      }}>
        <h2>Authentication Required</h2>
        <p>Please log in to access the chat.</p>
        <p><strong>Debug:</strong> userId={currentUserId}, role={userRole}</p>
      </div>
    );
  }

  return (
    <ChatProvider>
      <ChatComponent 
        userRole={userRole}
        currentUserId={parseInt(currentUserId)}
        currentUserName={currentUserName}
      />
    </ChatProvider>
  );
};

export default ChatApp;