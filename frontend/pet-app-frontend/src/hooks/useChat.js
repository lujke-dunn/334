import { useChatContext } from '../contexts/ChatContext';

// Custom hook for easier chat management
export const useChat = () => {
  const context = useChatContext();
  
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }

  return {
    // State
    conversations: context.conversations,
    selectedConversation: context.selectedConversation,
    totalUnreadCount: context.totalUnreadCount,
    isLoading: context.isLoading,
    error: context.error,
    websocketConnected: context.websocketConnected,
    
    // Actions
    loadConversations: context.loadConversations,
    selectConversation: context.selectConversation,
    sendMessage: context.sendMessage,
    markAsRead: context.markAsRead,
    sendTypingIndicator: context.sendTypingIndicator,
    
    // Utilities
    getConversationMessages: context.getConversationMessages,
    isTyping: (conversationId, userId) => 
      context.typingStatus[conversationId]?.[userId] || false,
  };
};

export default useChat;