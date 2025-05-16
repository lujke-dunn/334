
import React from 'react';
import { ChatProvider } from '../../contexts/ChatContext';
import ChatComponent from './ChatComponent';
import { getCurrentUserId, getCurrentUserName, getUserRole } from '../../utils/api';

// Main Chat Application Component
const ChatApp = () => {
  const currentUserId = getCurrentUserId();
  const currentUserName = getCurrentUserName();
  const userRole = getUserRole();

  // Make sure user is authenticated
  if (!currentUserId || !userRole) {
    return (
      <div className="chat-error">
        <p>Please log in to access the chat.</p>
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