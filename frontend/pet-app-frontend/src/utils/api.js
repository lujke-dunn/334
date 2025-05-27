// src/utils/api.js - Complete API utilities

// API Base URLs
const USER_SERVICE_URL = 'http://localhost:8080/api';
const MESSAGE_SERVICE_URL = 'http://localhost:8084/api';
const BOOKING_SERVICE_URL = 'http://localhost:8083/api';
const SERVICE_MANAGEMENT_URL = 'http://localhost:8082/api';

import { createMissingConversations} from "./bookingService.js";

export { createMissingConversations };


// Authentication utilities
export const getAccessToken = () => {
  return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
};

export const getAuthToken = () => {
  return getAccessToken();
};

export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
};

export const getCurrentUserEmail = () => {
  return localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail') || 'user@example.com';
};

export const getUserEmail = () => {
  return getCurrentUserEmail();
};

export const getCurrentUserId = () => {
  return localStorage.getItem('userId') || sessionStorage.getItem('userId') || '1';
};

export const getCurrentUserName = () => {
  return localStorage.getItem('userName') || sessionStorage.getItem('userName') || 'User';
};

export const getUserRole = () => {
  return localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || 'CUSTOMER';
};

export const getCurrentUser = () => {
  return {
    id: getCurrentUserId(),
    name: getCurrentUserName(),
    email: getCurrentUserEmail(),
    role: getUserRole(),
    accessToken: getAccessToken()
  };
};

export const getUserData = () => {
  return getCurrentUser();
};

export const getUserProfile = () => {
  return getCurrentUser();
};

export const setAuthData = (accessToken, refreshToken, userId, userName, userRole, userEmail) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('userId', userId);
  localStorage.setItem('userName', userName);
  localStorage.setItem('userRole', userRole);
  localStorage.setItem('userEmail', userEmail || `user${userId}@example.com`);
};

export const clearAuthData = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userEmail');
  sessionStorage.clear();
};

export const isAuthenticated = () => {
  return !!getAccessToken();
};

// HTTP request helper with auth
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = getAccessToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers.Authorization = `Bearer ${getAccessToken()}`;
      return await fetch(url, { ...config, headers });
    } else {
      clearAuthData();
      window.location.href = '/login';
      throw new Error('Authentication failed');
    }
  }

  return response;
};

// Auth API calls
export const login = async (email, password) => {
  const response = await fetch(`${USER_SERVICE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const data = await response.json();

  setAuthData(
    data.accessToken,
    data.refreshToken,
    data.userId || getCurrentUserId(),
    data.userName || email.split('@')[0],
    data.role || 'CUSTOMER',
    data.userEmail || email
  );

  return data;
};

export const signup = async (userData) => {
  const response = await fetch(`${USER_SERVICE_URL}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Signup failed');
  }

  return await response.json();
};

export const changePassword = async (email, oldPassword, newPassword) => {
  const response = await makeAuthenticatedRequest(`${USER_SERVICE_URL}/change-password`, {
    method: 'POST',
    body: JSON.stringify({
      email,
      oldPassword,
      newPassword
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Password change failed');
  }

  return await response.json();
};

export const logout = async () => {
  try {
    clearAuthData();
    window.location.href = '/login';
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    clearAuthData();
    window.location.href = '/login';
    return false;
  }
};

export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${USER_SERVICE_URL}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);

    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

export const refreshAuthToken = refreshAccessToken;

// Message Service API calls
export const fetchConversations = async (page = 0, size = 20) => {
  const userId = getCurrentUserId();
  const userRole = getUserRole();

  const response = await makeAuthenticatedRequest(
    `${MESSAGE_SERVICE_URL}/conversations?userId=${userId}&userType=${userRole}&page=${page}&size=${size}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch conversations: ${response.statusText}`);
  }

  return await response.json();
};

export const fetchMessages = async (conversationId, page = 0, size = 50) => {
  const response = await makeAuthenticatedRequest(
    `${MESSAGE_SERVICE_URL}/conversations/${conversationId}/messages?page=${page}&size=${size}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.statusText}`);
  }

  const data = await response.json();
  return data.messages || data;
};

export const markMessagesAsRead = async (conversationId) => {
  const userId = getCurrentUserId();
  const userRole = getUserRole();

  const response = await makeAuthenticatedRequest(
    `${MESSAGE_SERVICE_URL}/conversations/${conversationId}/read?userId=${userId}&userType=${userRole}`,
    { method: 'PUT' }
  );

  if (!response.ok) {
    throw new Error(`Failed to mark messages as read: ${response.statusText}`);
  }
};

export const createConversation = async (bookingId, customerId, contractorId) => {
  const response = await makeAuthenticatedRequest(`${MESSAGE_SERVICE_URL}/conversations`, {
    method: 'POST',
    body: JSON.stringify({
      bookingId,
      customerId,
      contractorId
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create conversation: ${response.statusText}`);
  }

  return await response.json();
};

// WebSocket functions
export const createWebSocketConnection = (
  onMessage,
  onError,
  onClose,
  conversationId = 1,
  userId = null
) => {
  if (!userId) {
    userId = getCurrentUserId();
  }

  const wsUrl = `ws://localhost:8084/ws/chat?conversationId=${conversationId}&userId=${userId}`;
  console.log('🔌 Connecting to:', wsUrl);

  const websocket = new WebSocket(wsUrl);

  websocket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      onMessage(message);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      onMessage({ type: 'ERROR', content: 'Failed to parse message' });
    }
  };

  websocket.onerror = onError;
  websocket.onclose = onClose;

  return websocket;
};

export const sendChatMessage = (websocket, conversationId, messageText) => {
  if (!websocket || websocket.readyState !== WebSocket.OPEN) {
    console.error('WebSocket not connected');
    return false;
  }

  const currentUserId = getCurrentUserId();
  const userRole = getUserRole();

  const message = {
    type: 'TEXT',
    conversationId: conversationId,
    senderId: parseInt(currentUserId),
    senderType: userRole.toUpperCase(),
    content: messageText
  };

  try {
    websocket.send(JSON.stringify(message));
    console.log('📤 Sent message:', message);
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
};

export const sendMessageToConversation = async (conversationId, messageText) => {
  const currentUserId = getCurrentUserId();
  const userRole = getUserRole();

  const messageData = {
    conversationId: conversationId,
    senderId: parseInt(currentUserId),
    content: messageText,
    messageType: 'TEXT',
    userType: userRole.toUpperCase()
  };

  const response = await makeAuthenticatedRequest(`${MESSAGE_SERVICE_URL}/messages`, {
    method: 'POST',
    body: JSON.stringify(messageData)
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return await response.json();
};

export const sendTypingIndicator = (websocket, conversationId) => {
  if (!websocket || websocket.readyState !== WebSocket.OPEN) {
    return false;
  }

  const currentUserId = getCurrentUserId();
  const userRole = getUserRole();

  const message = {
    type: 'TYPING_INDICATOR',
    conversationId: conversationId,
    senderId: parseInt(currentUserId),
    senderType: userRole.toUpperCase(),
    content: 'typing...'
  };

  try {
    websocket.send(JSON.stringify(message));
    return true;
  } catch (error) {
    console.error('Error sending typing indicator:', error);
    return false;
  }
};

export const sendWebSocketMessage = (websocket, messageData) => {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify(messageData));
    return true;
  }
  return false;
};

export const closeWebSocketConnection = (websocket) => {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.close();
  }
};

export const isWebSocketConnected = (websocket) => {
  return websocket && websocket.readyState === WebSocket.OPEN;
};

// Booking Service API calls
export const fetchBookings = async (page = 0, size = 20) => {
  const response = await makeAuthenticatedRequest(
    `${BOOKING_SERVICE_URL}/bookings/customer?page=${page}&size=${size}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch bookings: ${response.statusText}`);
  }

  return await response.json();
};

export const fetchContractorBookings = async (page = 0, size = 20) => {
  const response = await makeAuthenticatedRequest(
    `${BOOKING_SERVICE_URL}/bookings/contractor?page=${page}&size=${size}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch contractor bookings: ${response.statusText}`);
  }

  return await response.json();
};

export const fetchBookingById = async (bookingId) => {
  const response = await makeAuthenticatedRequest(`${BOOKING_SERVICE_URL}/bookings/${bookingId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch booking: ${response.statusText}`);
  }

  return await response.json();
};

export const createBooking = async (bookingData) => {
  const response = await makeAuthenticatedRequest(`${BOOKING_SERVICE_URL}/bookings`, {
    method: 'POST',
    body: JSON.stringify(bookingData)
  });

  if (!response.ok) {
    throw new Error(`Failed to create booking: ${response.statusText}`);
  }

  return await response.json();
};

// Participant tracking functions
export const getConversationParticipants = async (conversationId) => {
  try {
    const response = await makeAuthenticatedRequest(
      `${MESSAGE_SERVICE_URL}/conversations/${conversationId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get conversation: ${response.statusText}`);
    }

    const conversation = await response.json();
    const participants = [];

    if (conversation.customerId) {
      participants.push({
        id: conversation.customerId,
        name: `Customer ${conversation.customerId}`,
        email: `customer${conversation.customerId}@example.com`,
        role: 'CUSTOMER',
        type: 'customer'
      });
    }

    if (conversation.contractorId) {
      participants.push({
        id: conversation.contractorId,
        name: `Contractor ${conversation.contractorId}`,
        email: `contractor${conversation.contractorId}@example.com`,
        role: 'CONTRACTOR',
        type: 'contractor'
      });
    }

    return {
      conversation,
      participants,
      totalParticipants: participants.length
    };

  } catch (error) {
    console.error('Error getting conversation participants:', error);
    return {
      conversation: null,
      participants: [],
      totalParticipants: 0
    };
  }
};

export const getOtherParticipant = (participants) => {
  const currentUserId = parseInt(getCurrentUserId());
  return participants.find(p => p.id !== currentUserId);
};

export const formatParticipantsList = (participants) => {
  if (!participants || participants.length === 0) {
    return 'No participants';
  }

  const currentUserId = parseInt(getCurrentUserId());

  return participants.map(participant => {
    const isYou = participant.id === currentUserId;
    const roleIcon = participant.role === 'CUSTOMER' ? '🐕' : '🔧';
    const name = isYou ? 'You' : participant.name;

    return `${roleIcon} ${name}`;
  }).join(', ');
};

// Booking-based chat functions
export const getConversationByBookingId = async (bookingId) => {
  try {
    const response = await makeAuthenticatedRequest(
      `${MESSAGE_SERVICE_URL}/conversations/booking/${bookingId}`
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to get conversation: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error.message.includes('404')) {
      return null;
    }
    console.error('Error getting conversation by booking ID:', error);
    throw error;
  }
};

export const getOrCreateBookingConversation = async (bookingId) => {
  try {
    const existingConversation = await getConversationByBookingId(bookingId);

    if (existingConversation) {
      console.log('📞 Found existing conversation for booking:', bookingId);
      return existingConversation;
    }

    const booking = await fetchBookingById(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'CONFIRMED') {
      throw new Error(`Cannot create chat for booking with status: ${booking.status}`);
    }

    const newConversation = await createConversation(
      bookingId,
      booking.customerId,
      booking.contractorId
    );

    console.log('🆕 Created new conversation for booking:', bookingId);
    return newConversation;

  } catch (error) {
    console.error('Error getting/creating booking conversation:', error);
    throw error;
  }
};

export const getChatEnabledBookings = async () => {
  try {
    const userRole = getUserRole();

    let bookings;
    if (userRole === 'CUSTOMER') {
      const result = await fetchBookings(0, 100);
      bookings = result.content || result;
    } else {
      const result = await fetchContractorBookings(0, 100);
      bookings = result.content || result;
    }

    const confirmedBookings = bookings.filter(booking =>
      booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED'
    );

    const bookingsWithChats = await Promise.all(
      confirmedBookings.map(async (booking) => {
        try {
          const conversation = await getConversationByBookingId(booking.id);

          return {
            ...booking,
            hasChat: !!conversation,
            conversationId: conversation?.id || null,
            unreadCount: conversation ? (
              userRole === 'CUSTOMER'
                ? conversation.customerUnreadCount || 0
                : conversation.contractorUnreadCount || 0
            ) : 0,
            lastMessageTime: conversation?.lastMessageTime || null
          };
        } catch (error) {
          console.warn(`Could not get conversation for booking ${booking.id}:`, error);
          return {
            ...booking,
            hasChat: false,
            conversationId: null,
            unreadCount: 0,
            lastMessageTime: null
          };
        }
      })
    );

    return bookingsWithChats;
  } catch (error) {
    console.error('Error getting chat-enabled bookings:', error);
    return [];
  }
};

export const startBookingChat = async (bookingId) => {
  try {
    const conversation = await getOrCreateBookingConversation(bookingId);
    const participants = await getConversationParticipants(conversation.id);

    return {
      conversationId: conversation.id,
      bookingId: bookingId,
      participants: participants.participants,
      conversation: conversation
    };
  } catch (error) {
    console.error('Error starting booking chat:', error);
    throw error;
  }
};

export const getBookingChatSummary = async (bookingId) => {
  try {
    const booking = await fetchBookingById(bookingId);
    const conversation = await getConversationByBookingId(bookingId);

    if (!conversation) {
      return {
        booking,
        hasChat: false,
        canCreateChat: booking.status === 'CONFIRMED'
      };
    }

    const participants = await getConversationParticipants(conversation.id);
    const recentMessages = await fetchMessages(conversation.id, 0, 1);

    const userRole = getUserRole();
    const otherParticipant = getOtherParticipant(participants.participants);

    return {
      booking,
      conversation,
      hasChat: true,
      canCreateChat: false,
      participants: participants.participants,
      otherParticipant,
      unreadCount: userRole === 'CUSTOMER'
        ? conversation.customerUnreadCount || 0
        : conversation.contractorUnreadCount || 0,
      lastMessage: recentMessages && recentMessages.length > 0 ? recentMessages[0] : null,
      lastActivity: conversation.lastMessageTime
    };
  } catch (error) {
    console.error('Error getting booking chat summary:', error);
    return null;
  }
};

export const getBookingChatList = async () => {
  try {
    const chatEnabledBookings = await getChatEnabledBookings();

    const chatList = await Promise.all(
      chatEnabledBookings.map(async (booking) => {
        const summary = await getBookingChatSummary(booking.id);
        return summary;
      })
    );

    const validChats = chatList
      .filter(chat => chat !== null)
      .sort((a, b) => {
        const aTime = new Date(a.lastActivity || a.booking.createdAt || 0);
        const bTime = new Date(b.lastActivity || b.booking.createdAt || 0);
        return bTime - aTime;
      });

    return validChats;
  } catch (error) {
    console.error('Error getting booking chat list:', error);
    return [];
  }
};

export const formatBookingForChat = (booking) => {
  const service = booking.service || {};
  const startDate = new Date(booking.startTime || booking.scheduledDate);

  return {
    title: service.title || 'Pet Service',
    description: service.description || booking.notes || 'No description',
    date: startDate.toLocaleDateString(),
    time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: booking.status,
    price: booking.totalAmount ? `$${booking.totalAmount}` : 'Price not set',
    duration: service.duration ? `${service.duration} mins` : 'Duration not set',
    location: booking.location || 'Location not set'
  };
};

export const canAccessBookingChat = (booking) => {
  const currentUserId = parseInt(getCurrentUserId());
  const userRole = getUserRole();

  const isParticipant = (
    (userRole === 'CUSTOMER' && booking.customerId === currentUserId) ||
    (userRole === 'CONTRACTOR' && booking.contractorId === currentUserId)
  );

  const allowsChat = ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status);

  return isParticipant && allowsChat;
};

export const createBookingChatConnection = (
  bookingId,
  conversationId,
  onMessage,
  onError,
  onClose,
  onParticipantUpdate
) => {
  const websocket = createWebSocketConnection(
    (message) => {
      const enhancedMessage = {
        ...message,
        bookingId: bookingId,
        conversationId: conversationId
      };
      onMessage(enhancedMessage);
    },
    onError,
    onClose,
    conversationId
  );

  websocket.bookingId = bookingId;
  websocket.sendBookingMessage = (messageText) => {
    return sendChatMessage(websocket, conversationId, messageText);
  };

  return websocket;
};

// Utility functions
export const checkServiceHealth = async (serviceName, port) => {
  try {
    const response = await fetch(`http://localhost:${port}/api/test/health`);
    return { healthy: response.ok, status: response.status };
  } catch (error) {
    console.error(`Health check failed for ${serviceName}:`, error);
    return { healthy: false, error: error.message };
  }
};

export const checkAllServicesHealth = async () => {
  const services = [
    { name: 'User Service', port: 8080 },
    { name: 'Service Management', port: 8082 },
    { name: 'Booking Service', port: 8083 },
    { name: 'Message Service', port: 8084 }
  ];

  const healthChecks = await Promise.all(
    services.map(async (service) => {
      const health = await checkServiceHealth(service.name, service.port);
      return {
        ...service,
        ...health
      };
    })
  );

  console.log('🏥 Service Health Check Results:');
  healthChecks.forEach(service => {
    const status = service.healthy ? '✅' : '❌';
    console.log(`${status} ${service.name} (${service.port}): ${service.healthy ? 'UP' : 'DOWN'}`);
    if (!service.healthy && service.error) {
      console.log(`   Error: ${service.error}`);
    }
  });

  return healthChecks;
};

export const verifyRequiredServices = async () => {
  const health = await checkAllServicesHealth();
  const downServices = health.filter(s => !s.healthy);

  if (downServices.length > 0) {
    console.warn('⚠️ Some services are down:');
    downServices.forEach(service => {
      console.warn(`❌ ${service.name} (port ${service.port})`);
    });

    console.log('\n🔧 To start missing services:');
    downServices.forEach(service => {
      const servicePath = service.name.replace(' ', '');
      console.log(`cd backend/${servicePath} && ./mvnw spring-boot:run`);
    });
  }

  return health;
};

export const checkWebSocketHealth = async () => {
  try {
    const response = await fetch('http://localhost:8084/api/test/websocket-info');
    if (response.ok) {
      const data = await response.json();
      console.log('🔌 WebSocket endpoints available:', data.availableEndpoints);
      return true;
    }
  } catch (error) {
    console.error('❌ WebSocket service not available:', error.message);
    console.log('💡 Start Message Service: cd backend/MessageService && ./mvnw spring-boot:run');
  }
  return false;
};

export const handleApiError = (error) => {
  console.error('API Error:', error);

  if (error.message.includes('Failed to fetch')) {
    return 'Network error. Please check your connection.';
  }

  if (error.message.includes('401')) {
    return 'Authentication failed. Please log in again.';
  }

  if (error.message.includes('403')) {
    return 'You do not have permission to perform this action.';
  }

  if (error.message.includes('404')) {
    return 'The requested resource was not found.';
  }

  if (error.message.includes('500')) {
    return 'Server error. Please try again later.';
  }

  return error.message || 'An unexpected error occurred.';
};

export const debugAuthState = () => {
  const authState = {
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
    userId: getCurrentUserId(),
    userName: getCurrentUserName(),
    userEmail: getCurrentUserEmail(),
    userRole: getUserRole(),
    isAuthenticated: isAuthenticated()
  };

  console.log('🔍 Current Auth State:', authState);
  return authState;
};

export default {
  // Auth
  login,
  signup,
  logout,
  refreshAccessToken,
  refreshAuthToken,
  getAccessToken,
  getCurrentUserId,
  getCurrentUserName,
  getUserRole,
  getCurrentUserEmail,
  getUserEmail,
  isAuthenticated,

  // WebSocket
  createWebSocketConnection,
  sendChatMessage,
  sendTypingIndicator,
  sendMessageToConversation,

  // Messaging
  fetchConversations,
  fetchMessages,
  markMessagesAsRead,
  createConversation,

  // Participants
  getConversationParticipants,
  getOtherParticipant,
  formatParticipantsList,

  // Booking Chat
  getOrCreateBookingConversation,
  getConversationByBookingId,
  getChatEnabledBookings,
  startBookingChat,
  getBookingChatSummary,
  getBookingChatList,
  formatBookingForChat,
  canAccessBookingChat,
  createBookingChatConnection,
  createMissingConversations,

  // Bookings
  fetchBookings,
  fetchContractorBookings,
  fetchBookingById,
  createBooking,

  // Utilities
  checkServiceHealth,
  checkAllServicesHealth,
  verifyRequiredServices,
  checkWebSocketHealth,
  handleApiError,
  debugAuthState
};