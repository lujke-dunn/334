import React, { useState, useEffect } from 'react';
import BookingChatList from './BookingChatList';
import BookingChatComponent from './BookingChatComponent';
import ChatDebugComponent from './ChatDebugComponent';
import {
  getCurrentUserId,
  getUserRole,
  checkWebSocketHealth,
  verifyRequiredServices
} from '../../../utils/api';

const ChatApp = () => {
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'chat' or 'debug'
  const [selectedChat, setSelectedChat] = useState(null);
  const [servicesStatus, setServicesStatus] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const currentUserId = getCurrentUserId();
  const userRole = getUserRole();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing Chat App...');

      // Check if required services are running
      const services = await verifyRequiredServices();
      setServicesStatus(services);

      // Check WebSocket health
      const wsHealthy = await checkWebSocketHealth();

      if (!wsHealthy) {
        console.warn('⚠️ WebSocket service not available');
      }

      console.log('✅ Chat App initialized');
      setIsInitialized(true);

    } catch (error) {
      console.error('❌ Error initializing Chat App:', error);
      setIsInitialized(true); // Still show the app even if health checks fail
    }
  };

  const handleSelectChat = (chatInfo) => {
    console.log('📱 Selected chat:', chatInfo);

    // Validate chatInfo before setting
    if (!chatInfo || !chatInfo.conversationId || !chatInfo.bookingId) {
      console.error('❌ Invalid chat info:', chatInfo);
      alert('Invalid chat information received');
      return;
    }

    setSelectedChat(chatInfo);
    setCurrentView('chat');
  };

  const handleBackToList = () => {
    console.log('🔙 Going back to chat list');
    setSelectedChat(null);
    setCurrentView('list');
  };

  // Show loading screen during initialization
  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8f9fa',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <h2 style={{ margin: '0 0 12px 0', color: '#333' }}>
            Initializing Pet Service Chat
          </h2>
          <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
            Checking services and establishing connections...
          </p>
        </div>

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Show service status warnings if needed
  const downServices = servicesStatus?.filter(s => !s.healthy) || [];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Service Status Warning */}
      {downServices.length > 0 && (
        <div style={{
          backgroundColor: '#fff3cd',
          color: '#856404',
          padding: '12px 20px',
          borderBottom: '1px solid #ffeaa7',
          textAlign: 'center',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>
            ⚠️ Some services are not available: {downServices.map(s => s.name).join(', ')}.
            Chat functionality may be limited.
          </span>
          <button
            onClick={() => setShowDebug(!showDebug)}
            style={{
              padding: '4px 12px',
              border: '1px solid #856404',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              color: '#856404',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </button>
        </div>
      )}

      {/* Debug Component */}
      {showDebug && (
        <div>
          <ChatDebugComponent />
        </div>
      )}

      {/* Main Content */}
      {currentView === 'list' ? (
        <BookingChatList
          onSelectChat={handleSelectChat}
        />
      ) : (
        <BookingChatComponent
          chatInfo={selectedChat}
          onBack={handleBackToList}
          userRole={userRole}
          currentUserId={currentUserId}
        />
      )}

      {/* Footer with user info */}
      <div style={{
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid #eee',
        padding: '8px 20px',
        fontSize: '12px',
        color: '#666',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <span>
            🐕 Pet Service Chat • {userRole} #{currentUserId}
          </span>
          <span>
            {servicesStatus && (
              <>
                Services: {servicesStatus.filter(s => s.healthy).length}/{servicesStatus.length} online
              </>
            )}
          </span>
          <span>
            {currentView === 'list' ? '📋 Chat List' : '💬 In Chat'}
          </span>
        </div>
      </div>

      {/* Add some bottom padding to account for fixed footer */}
      <div style={{ height: '60px' }} />
    </div>
  );
};

export default ChatApp;