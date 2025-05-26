import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import {
  fetchConversations,
  fetchMessages,
  markMessagesAsRead,
  createWebSocketConnection,
  getCurrentUserId,
  getCurrentUserName,
  getUserRole
} from '../utils/api';

// Create the context
const ChatContext = createContext();

// Chat actions
const CHAT_ACTIONS = {
  SET_CONVERSATIONS: 'SET_CONVERSATIONS',
  SELECT_CONVERSATION: 'SELECT_CONVERSATION',
  ADD_MESSAGE: 'ADD_MESSAGE',
  MARK_AS_READ: 'MARK_AS_READ',
  SET_UNREAD_COUNT: 'SET_UNREAD_COUNT',
  SET_ONLINE_STATUS: 'SET_ONLINE_STATUS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  UPDATE_MESSAGE_STATUS: 'UPDATE_MESSAGE_STATUS',
  SET_TYPING_STATUS: 'SET_TYPING_STATUS',
  WEBSOCKET_CONNECTED: 'WEBSOCKET_CONNECTED',
  WEBSOCKET_DISCONNECTED: 'WEBSOCKET_DISCONNECTED',
  LOAD_CONVERSATION_MESSAGES: 'LOAD_CONVERSATION_MESSAGES'
};

// Initial state
const initialState = {
  conversations: [],
  selectedConversation: null,
  totalUnreadCount: 0,
  isLoading: false,
  error: null,
  websocketConnected: false,
  typingStatus: {},
  messagesCache: {},
};

// Reducer function
const chatReducer = (state, action) => {
  switch (action.type) {
    case CHAT_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case CHAT_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };

    case CHAT_ACTIONS.WEBSOCKET_CONNECTED:
      return { ...state, websocketConnected: true };

    case CHAT_ACTIONS.WEBSOCKET_DISCONNECTED:
      return { ...state, websocketConnected: false };

    case CHAT_ACTIONS.SET_CONVERSATIONS:
      const conversations = action.payload;
      const userRole = getUserRole();
      const unreadField = userRole === 'CUSTOMER' ? 'customerUnreadCount' : 'contractorUnreadCount';
      const totalUnread = conversations.reduce((total, conv) => {
        return total + (conv[unreadField] || 0);
      }, 0);

      return {
        ...state,
        conversations,
        totalUnreadCount: totalUnread
      };

    case CHAT_ACTIONS.LOAD_CONVERSATION_MESSAGES:
      return {
        ...state,
        messagesCache: {
          ...state.messagesCache,
          [action.payload.conversationId]: action.payload.messages
        }
      };

    case CHAT_ACTIONS.SELECT_CONVERSATION:
      return {
        ...state,
        selectedConversation: action.payload
      };

    case CHAT_ACTIONS.ADD_MESSAGE:
      const { conversationId, message } = action.payload;

      // Update messages cache
      const currentMessages = state.messagesCache[conversationId] || [];
      const updatedMessagesCache = {
        ...state.messagesCache,
        [conversationId]: [...currentMessages, message]
      };

      // Update conversations list
      const currentUserId = parseInt(getCurrentUserId());
      const currentUserRole = getUserRole();
      const unreadFieldForAdd = currentUserRole === 'CUSTOMER' ? 'customerUnreadCount' : 'contractorUnreadCount';

      const updatedConversations = state.conversations.map(chat => {
        if (chat.id === conversationId) {
          const isOwnMessage = message.senderId === currentUserId;
          return {
            ...chat,
            lastMessage: message.content,
            lastMessageTime: message.createdAt,
            // Don't increment unread count for own messages
            ...((!isOwnMessage) && {
              [unreadFieldForAdd]: (chat[unreadFieldForAdd] || 0) + 1
            })
          };
        }
        return chat;
      });

      // Update selected conversation if it's the same
      const updatedSelectedConversation = state.selectedConversation?.id === conversationId
        ? {
            ...state.selectedConversation,
            lastMessage: message.content,
            lastMessageTime: message.createdAt
          }
        : state.selectedConversation;

      const isOwnMessage = message.senderId === currentUserId;
      return {
        ...state,
        conversations: updatedConversations,
        selectedConversation: updatedSelectedConversation,
        messagesCache: updatedMessagesCache,
        totalUnreadCount: state.totalUnreadCount + (isOwnMessage ? 0 : 1)
      };

    case CHAT_ACTIONS.MARK_AS_READ:
      const currentUserRoleForRead = getUserRole();
      const unreadFieldForRead = currentUserRoleForRead === 'CUSTOMER' ? 'customerUnreadCount' : 'contractorUnreadCount';
      const conversationToMarkRead = state.conversations.find(chat => chat.id === action.payload);
      const unreadCount = conversationToMarkRead?.[unreadFieldForRead] || 0;

      return {
        ...state,
        conversations: state.conversations.map(chat =>
          chat.id === action.payload
            ? { ...chat, [unreadFieldForRead]: 0 }
            : chat
        ),
        totalUnreadCount: Math.max(0, state.totalUnreadCount - unreadCount)
      };

    case CHAT_ACTIONS.SET_TYPING_STATUS:
      return {
        ...state,
        typingStatus: {
          ...state.typingStatus,
          [action.payload.conversationId]: {
            ...state.typingStatus[action.payload.conversationId],
            [action.payload.userId]: action.payload.isTyping
          }
        }
      };

    case CHAT_ACTIONS.UPDATE_MESSAGE_STATUS:
      const { messageId, status } = action.payload;
      const updatedCache = { ...state.messagesCache };

      Object.keys(updatedCache).forEach(convId => {
        updatedCache[convId] = updatedCache[convId].map(msg =>
          msg.id === messageId ? { ...msg, status } : msg
        );
      });

      return { ...state, messagesCache: updatedCache };

    default:
      return state;
  }
};

// Chat Provider Component
export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const websocketRef = useRef(null);
  const typingTimeoutRef = useRef({});
  const actionsRef = useRef(null);

  // WebSocket message handler
  const handleWebSocketMessage = (wsMessage) => {
    console.log('Received WebSocket message:', wsMessage);
    const { type, conversationId, senderId, content, messageId } = wsMessage;

    switch (type) {
      case 'AUTH':
        console.log('Authentication response:', content);
        if (content === 'Authentication successful') {
          console.log('✅ WebSocket authenticated successfully');
        }
        break;

      case 'CONNECTION':
        console.log('Connection message:', content);
        break;

      case 'HEARTBEAT':
        // Handle heartbeat response - no action needed
        break;

      case 'TEXT':
      case 'IMAGE':
      case 'FILE':
      case 'SYSTEM':
        // Add the message to the conversation
        const newMessage = {
          id: messageId || Date.now(),
          content,
          senderId,
          senderType: wsMessage.senderType,
          messageType: type,
          createdAt: wsMessage.sendTime || new Date().toISOString(),
          isRead: false,
          attachmentData: wsMessage.attachmentData,
          attachmentFilename: wsMessage.attachmentFilename
        };

        if (actionsRef.current) {
          actionsRef.current.addMessage(conversationId, newMessage);
        }
        break;

      case 'TYPING_INDICATOR':
        if (actionsRef.current) {
          actionsRef.current.setTypingStatus(conversationId, senderId, true);

          // Clear previous timeout for this user
          const timeoutKey = `${conversationId}-${senderId}`;
          if (typingTimeoutRef.current[timeoutKey]) {
            clearTimeout(typingTimeoutRef.current[timeoutKey]);
          }

          // Set new timeout to clear typing status
          typingTimeoutRef.current[timeoutKey] = setTimeout(() => {
            if (actionsRef.current) {
              actionsRef.current.setTypingStatus(conversationId, senderId, false);
            }
            delete typingTimeoutRef.current[timeoutKey];
          }, 3000);
        }
        break;

      case 'READ_RECEIPT':
        if (actionsRef.current) {
          actionsRef.current.updateMessageStatus(messageId, 'read');
        }
        break;

      case 'ERROR':
        dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: content });
        break;

      default:
        console.log('Unknown WebSocket message type:', type);
    }
  };

  // WebSocket error handler
  const handleWebSocketError = (error) => {
    console.error('WebSocket error:', error);
    dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: 'Connection error' });
    dispatch({ type: CHAT_ACTIONS.WEBSOCKET_DISCONNECTED });
  };

  // WebSocket close handler
  const handleWebSocketClose = (event) => {
    console.log('WebSocket closed:', event);
    dispatch({ type: CHAT_ACTIONS.WEBSOCKET_DISCONNECTED });

    // Attempt to reconnect after 3 seconds
    setTimeout(() => {
      if (websocketRef.current?.readyState === WebSocket.CLOSED) {
        connectWebSocket();
      }
    }, 3000);
  };

  // Connect to WebSocket
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
        dispatch({ type: CHAT_ACTIONS.WEBSOCKET_CONNECTED });
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      handleWebSocketError(error);
    }
  };

  // Actions
  const actions = {
    // Load conversations from backend
    loadConversations: async (page = 0, size = 20) => {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });
      try {
        const response = await fetchConversations(page, size);
        dispatch({ type: CHAT_ACTIONS.SET_CONVERSATIONS, payload: response.content || response });
      } catch (error) {
        dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: error.message });
      } finally {
        dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: false });
      }
    },

    // Load messages for a conversation
    loadConversationMessages: async (conversationId, page = 0, size = 50) => {
      try {
        const response = await fetchMessages(conversationId, page, size);
        const messages = Array.isArray(response) ? response : (response.messages || response.content || []);
        dispatch({
          type: CHAT_ACTIONS.LOAD_CONVERSATION_MESSAGES,
          payload: {
            conversationId,
            messages
          }
        });
      } catch (error) {
        dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: error.message });
      }
    },

    selectConversation: async (conversation) => {
      dispatch({ type: CHAT_ACTIONS.SELECT_CONVERSATION, payload: conversation });

      // Load messages if not already loaded
      if (!state.messagesCache[conversation.id]) {
        await actions.loadConversationMessages(conversation.id);
      }

      // Mark as read when selecting
      const userRole = getUserRole();
      const unreadField = userRole === 'CUSTOMER' ? 'customerUnreadCount' : 'contractorUnreadCount';

      if (conversation[unreadField] > 0) {
        await actions.markAsRead(conversation.id);
      }
    },

    // Send message via WebSocket
    sendMessage: (conversationId, content, messageType = 'TEXT', attachmentData = null, attachmentFilename = null) => {
      if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
        dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: 'Not connected to chat server' });
        return;
      }

      const message = {
        type: messageType,
        conversationId,
        senderId: parseInt(getCurrentUserId()),
        senderType: getUserRole(),
        content,
        attachmentData,
        attachmentFilename,
        sendTime: new Date().toISOString(),
        senderName: getCurrentUserName()
      };

      websocketRef.current.send(JSON.stringify(message));
    },

    // Add message to state (used by WebSocket handler)
    addMessage: (conversationId, message) => {
      dispatch({
        type: CHAT_ACTIONS.ADD_MESSAGE,
        payload: { conversationId, message }
      });
    },

    markAsRead: async (conversationId) => {
      try {
        await markMessagesAsRead(conversationId);
        dispatch({ type: CHAT_ACTIONS.MARK_AS_READ, payload: conversationId });
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
      }
    },

    setTypingStatus: (conversationId, userId, isTyping) => {
      dispatch({
        type: CHAT_ACTIONS.SET_TYPING_STATUS,
        payload: { conversationId, userId, isTyping }
      });
    },

    updateMessageStatus: (messageId, status) => {
      dispatch({
        type: CHAT_ACTIONS.UPDATE_MESSAGE_STATUS,
        payload: { messageId, status }
      });
    },

    // Send typing indicator
    sendTypingIndicator: (conversationId) => {
      if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
        return;
      }

      const message = {
        type: 'TYPING_INDICATOR',
        conversationId,
        senderId: parseInt(getCurrentUserId()),
        senderType: getUserRole(),
        content: '',
        sendTime: new Date().toISOString()
      };

      websocketRef.current.send(JSON.stringify(message));
    },

    // Connect to WebSocket
    connect: connectWebSocket,

    // Disconnect WebSocket
    disconnect: () => {
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
      dispatch({ type: CHAT_ACTIONS.WEBSOCKET_DISCONNECTED });
    }
  };

  // Store actions in ref for WebSocket handlers
  actionsRef.current = actions;

  // Initialize on mount
  useEffect(() => {
    actions.loadConversations();
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      actions.disconnect();
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
    };
  }, []); // Empty dependency array is intentional

  const value = {
    ...state,
    ...actions,
    getConversationMessages: (conversationId) => state.messagesCache[conversationId] || []
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