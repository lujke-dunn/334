// src/utils/api.js - Complete API utilities

// API Base URLs
const USER_SERVICE_URL = 'http://localhost:8080/api';
const MESSAGE_SERVICE_URL = 'http://localhost:8084/api';
const BOOKING_SERVICE_URL = 'http://localhost:8083/api';
const SERVICE_MANAGEMENT_URL = 'http://localhost:8082/api';

// Authentication utilities
export const getAccessToken = () => {
  return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
};

export const getAuthToken = () => {
  return getAccessToken(); // Alias for compatibility
};

export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
};

export const getCurrentUserEmail = () => {
  return localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail') || 'user@example.com';
};

export const getUserEmail = () => {
  return getCurrentUserEmail(); // Alias for compatibility
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
  return getCurrentUser(); // Alias for compatibility
};

export const getUserProfile = () => {
  return getCurrentUser(); // Alias for compatibility
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
    // Token might be expired, try to refresh
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry the request with new token
      headers.Authorization = `Bearer ${getAccessToken()}`;
      return await fetch(url, { ...config, headers });
    } else {
      // Refresh failed, redirect to login
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

  // Store auth data
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

export const forgotPassword = async (email) => {
  const response = await fetch(`${USER_SERVICE_URL}/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Password reset request failed');
  }

  return await response.json();
};

export const resetPassword = async (token, newPassword) => {
  const response = await fetch(`${USER_SERVICE_URL}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, newPassword }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Password reset failed');
  }

  return await response.json();
};

// Logout function
export const logout = async () => {
  try {
    // Optional: Call logout endpoint on server if it exists
    // const response = await makeAuthenticatedRequest(`${USER_SERVICE_URL}/logout`, {
    //   method: 'POST'
    // });

    // Clear all auth data
    clearAuthData();

    // Redirect to login page
    window.location.href = '/login';

    return true;
  } catch (error) {
    console.error('Logout error:', error);
    // Even if server logout fails, clear local data
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

// Alias for compatibility
export const refreshAuthToken = refreshAccessToken;

// User Profile API calls
export const fetchUserProfile = async (userId = null) => {
  const targetUserId = userId || getCurrentUserId();

  const response = await makeAuthenticatedRequest(`${USER_SERVICE_URL}/users/${targetUserId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.statusText}`);
  }

  return await response.json();
};

export const updateUserProfile = async (profileData) => {
  const response = await makeAuthenticatedRequest(`${USER_SERVICE_URL}/users/profile`, {
    method: 'PUT',
    body: JSON.stringify(profileData)
  });

  if (!response.ok) {
    throw new Error(`Failed to update profile: ${response.statusText}`);
  }

  const updatedData = await response.json();

  // Update local storage with new data
  if (updatedData.name) localStorage.setItem('userName', updatedData.name);
  if (updatedData.email) localStorage.setItem('userEmail', updatedData.email);

  return updatedData;
};

export const uploadAvatar = async (avatarFile) => {
  const formData = new FormData();
  formData.append('avatar', avatarFile);

  const response = await makeAuthenticatedRequest(`${USER_SERVICE_URL}/users/avatar`, {
    method: 'POST',
    headers: {}, // Don't set Content-Type for FormData
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Failed to upload avatar: ${response.statusText}`);
  }

  return await response.json();
};

export const deleteAccount = async (password) => {
  const response = await makeAuthenticatedRequest(`${USER_SERVICE_URL}/users/account`, {
    method: 'DELETE',
    body: JSON.stringify({ password })
  });

  if (!response.ok) {
    throw new Error(`Failed to delete account: ${response.statusText}`);
  }

  // Clear auth data after successful deletion
  clearAuthData();

  return await response.json();
};

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
  return data.messages || data; // Handle both paginated and direct array responses
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

// WebSocket connection for real-time messaging
export const createWebSocketConnection = (onMessage, onError, onClose) => {
  const userId = getCurrentUserId();
  const userRole = getUserRole();

  // Simple WebSocket connection without query parameters
  const wsUrl = `ws://localhost:8084/ws/chat`;

  console.log('🔌 Connecting to WebSocket:', wsUrl);

  const websocket = new WebSocket(wsUrl);

  websocket.onopen = (event) => {
    console.log('✅ WebSocket connected successfully');

    // Send authentication message
    const authMessage = {
      type: 'AUTH',
      senderId: parseInt(userId),
      senderType: userRole,
      content: 'authenticate',
      token: getAccessToken(),
      sendTime: new Date().toISOString(),
      senderName: getCurrentUserName()
    };

    console.log('🔐 Sending auth message:', authMessage);
    websocket.send(JSON.stringify(authMessage));
  };

  websocket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      onMessage(message);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      onError(error);
    }
  };

  websocket.onerror = (error) => {
    console.error('WebSocket error:', error);
    onError(error);
  };

  websocket.onclose = (event) => {
    console.log('WebSocket connection closed:', event.code, event.reason);
    onClose(event);
  };

  return websocket;
};

// WebSocket utility functions
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

export const getWebSocketReadyState = (websocket) => {
  if (!websocket) return 'CLOSED';

  switch (websocket.readyState) {
    case WebSocket.CONNECTING: return 'CONNECTING';
    case WebSocket.OPEN: return 'OPEN';
    case WebSocket.CLOSING: return 'CLOSING';
    case WebSocket.CLOSED: return 'CLOSED';
    default: return 'UNKNOWN';
  }
};

export const isWebSocketConnected = (websocket) => {
  return websocket && websocket.readyState === WebSocket.OPEN;
};

// Chat-specific WebSocket functions
export const sendChatMessage = (websocket, conversationId, content, messageType = 'TEXT') => {
  const message = {
    type: messageType,
    conversationId,
    senderId: parseInt(getCurrentUserId()),
    senderType: getUserRole(),
    content,
    sendTime: new Date().toISOString(),
    senderName: getCurrentUserName()
  };

  return sendWebSocketMessage(websocket, message);
};

export const joinConversation = (websocket, conversationId) => {
  if (!websocket || websocket.readyState !== WebSocket.OPEN) {
    return false;
  }

  const message = {
    type: 'CONNECTION',
    conversationId,
    senderId: parseInt(getCurrentUserId()),
    senderType: getUserRole(),
    content: 'join_conversation',
    sendTime: new Date().toISOString()
  };

  return sendWebSocketMessage(websocket, message);
};

export const sendTypingIndicator = (websocket, conversationId) => {
  const message = {
    type: 'TYPING_INDICATOR',
    conversationId,
    senderId: parseInt(getCurrentUserId()),
    senderType: getUserRole(),
    content: '',
    sendTime: new Date().toISOString()
  };

  return sendWebSocketMessage(websocket, message);
};

export const sendReadReceipt = (websocket, conversationId, messageId) => {
  const message = {
    type: 'READ_RECEIPT',
    conversationId,
    messageId,
    senderId: parseInt(getCurrentUserId()),
    senderType: getUserRole(),
    content: '',
    sendTime: new Date().toISOString()
  };

  return sendWebSocketMessage(websocket, message);
};

export const sendHeartbeat = (websocket) => {
  const message = {
    type: 'HEARTBEAT',
    senderId: parseInt(getCurrentUserId()),
    senderType: getUserRole(),
    content: 'ping',
    sendTime: new Date().toISOString()
  };

  return sendWebSocketMessage(websocket, message);
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

export const acceptBooking = async (bookingId) => {
  const response = await makeAuthenticatedRequest(`${BOOKING_SERVICE_URL}/bookings/${bookingId}/accept`, {
    method: 'PUT'
  });

  if (!response.ok) {
    throw new Error(`Failed to accept booking: ${response.statusText}`);
  }

  return await response.json();
};

export const rejectBooking = async (bookingId, reason) => {
  const response = await makeAuthenticatedRequest(`${BOOKING_SERVICE_URL}/bookings/${bookingId}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ reason })
  });

  if (!response.ok) {
    throw new Error(`Failed to reject booking: ${response.statusText}`);
  }

  return await response.json();
};

export const cancelBooking = async (bookingId, reason) => {
  const response = await makeAuthenticatedRequest(`${BOOKING_SERVICE_URL}/bookings/${bookingId}/cancel`, {
    method: 'PUT',
    body: JSON.stringify({ reason })
  });

  if (!response.ok) {
    throw new Error(`Failed to cancel booking: ${response.statusText}`);
  }

  return await response.json();
};

export const completeBooking = async (bookingId) => {
  const response = await makeAuthenticatedRequest(`${BOOKING_SERVICE_URL}/bookings/${bookingId}/complete`, {
    method: 'PUT'
  });

  if (!response.ok) {
    throw new Error(`Failed to complete booking: ${response.statusText}`);
  }

  return await response.json();
};

export const startService = async (bookingId) => {
  const response = await makeAuthenticatedRequest(`${BOOKING_SERVICE_URL}/bookings/${bookingId}/start`, {
    method: 'PUT'
  });

  if (!response.ok) {
    throw new Error(`Failed to start service: ${response.statusText}`);
  }

  return await response.json();
};

export const addBookingReview = async (bookingId, rating, review) => {
  const response = await makeAuthenticatedRequest(`${BOOKING_SERVICE_URL}/bookings/${bookingId}/review`, {
    method: 'POST',
    body: JSON.stringify({ rating, review })
  });

  if (!response.ok) {
    throw new Error(`Failed to add review: ${response.statusText}`);
  }

  return await response.json();
};

export const reportNoShow = async (bookingId, customerNoShow) => {
  const response = await makeAuthenticatedRequest(`${BOOKING_SERVICE_URL}/bookings/${bookingId}/no-show`, {
    method: 'POST',
    body: JSON.stringify({ customerNoShow })
  });

  if (!response.ok) {
    throw new Error(`Failed to report no-show: ${response.statusText}`);
  }

  return await response.json();
};

export const reportDispute = async (bookingId, reason) => {
  const response = await makeAuthenticatedRequest(`${BOOKING_SERVICE_URL}/bookings/${bookingId}/dispute`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });

  if (!response.ok) {
    throw new Error(`Failed to report dispute: ${response.statusText}`);
  }

  return await response.json();
};

// Service Management API calls
export const fetchServices = async (page = 0, size = 20) => {
  const response = await fetch(`${SERVICE_MANAGEMENT_URL}/services?page=${page}&size=${size}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch services: ${response.statusText}`);
  }

  return await response.json();
};

export const fetchServiceById = async (serviceId) => {
  const response = await fetch(`${SERVICE_MANAGEMENT_URL}/services/${serviceId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch service: ${response.statusText}`);
  }

  return await response.json();
};

export const searchServices = async (searchTerm, filters = {}) => {
  const queryParams = new URLSearchParams({
    searchTerm,
    ...filters
  });

  const response = await fetch(`${SERVICE_MANAGEMENT_URL}/services/search?${queryParams}`);

  if (!response.ok) {
    throw new Error(`Failed to search services: ${response.statusText}`);
  }

  return await response.json();
};

export const fetchServicesByCategory = async (category) => {
  const response = await fetch(`${SERVICE_MANAGEMENT_URL}/services/category/${category}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch services by category: ${response.statusText}`);
  }

  return await response.json();
};

export const fetchFeaturedServices = async () => {
  const response = await fetch(`${SERVICE_MANAGEMENT_URL}/services/featured`);

  if (!response.ok) {
    throw new Error(`Failed to fetch featured services: ${response.statusText}`);
  }

  return await response.json();
};

export const fetchTopRatedServices = async (limit = 10, minReviews = 5) => {
  const response = await fetch(`${SERVICE_MANAGEMENT_URL}/services/top-rated?limit=${limit}&minReviews=${minReviews}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch top-rated services: ${response.statusText}`);
  }

  return await response.json();
};

export const fetchContractorServices = async (contractorId) => {
  const response = await fetch(`${SERVICE_MANAGEMENT_URL}/services/contractor/${contractorId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch contractor services: ${response.statusText}`);
  }

  return await response.json();
};

export const createService = async (serviceData) => {
  const response = await makeAuthenticatedRequest(`${SERVICE_MANAGEMENT_URL}/services`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Contractor-ID': getCurrentUserId(),
      'X-Contractor-Name': getCurrentUserName(),
      'X-Contractor-Email': getCurrentUserEmail()
    },
    body: JSON.stringify(serviceData)
  });

  if (!response.ok) {
    throw new Error(`Failed to create service: ${response.statusText}`);
  }

  return await response.json();
};

export const updateService = async (serviceId, serviceData) => {
  const response = await makeAuthenticatedRequest(`${SERVICE_MANAGEMENT_URL}/services/${serviceId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Contractor-ID': getCurrentUserId(),
      'X-Contractor-Name': getCurrentUserName(),
      'X-Contractor-Email': getCurrentUserEmail()
    },
    body: JSON.stringify(serviceData)
  });

  if (!response.ok) {
    throw new Error(`Failed to update service: ${response.statusText}`);
  }

  return await response.json();
};

export const deleteService = async (serviceId) => {
  const response = await makeAuthenticatedRequest(`${SERVICE_MANAGEMENT_URL}/services/${serviceId}`, {
    method: 'DELETE',
    headers: {
      'X-Contractor-ID': getCurrentUserId()
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to delete service: ${response.statusText}`);
  }
};

export const approveService = async (serviceId) => {
  const response = await makeAuthenticatedRequest(`${SERVICE_MANAGEMENT_URL}/services/${serviceId}/approve`, {
    method: 'PUT'
  });

  if (!response.ok) {
    throw new Error(`Failed to approve service: ${response.statusText}`);
  }

  return await response.json();
};

// Notification and Settings API calls
export const fetchNotifications = async (page = 0, size = 20) => {
  const response = await makeAuthenticatedRequest(
    `${USER_SERVICE_URL}/notifications?page=${page}&size=${size}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.statusText}`);
  }

  return await response.json();
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await makeAuthenticatedRequest(`${USER_SERVICE_URL}/notifications/${notificationId}/read`, {
    method: 'PUT'
  });

  if (!response.ok) {
    throw new Error(`Failed to mark notification as read: ${response.statusText}`);
  }

  return await response.json();
};

export const markAllNotificationsAsRead = async () => {
  const response = await makeAuthenticatedRequest(`${USER_SERVICE_URL}/notifications/mark-all-read`, {
    method: 'PUT'
  });

  if (!response.ok) {
    throw new Error(`Failed to mark all notifications as read: ${response.statusText}`);
  }

  return await response.json();
};

export const updateNotificationSettings = async (settings) => {
  const response = await makeAuthenticatedRequest(`${USER_SERVICE_URL}/users/notification-settings`, {
    method: 'PUT',
    body: JSON.stringify(settings)
  });

  if (!response.ok) {
    throw new Error(`Failed to update notification settings: ${response.statusText}`);
  }

  return await response.json();
};

export const fetchUserSettings = async () => {
  const response = await makeAuthenticatedRequest(`${USER_SERVICE_URL}/users/settings`);

  if (!response.ok) {
    throw new Error(`Failed to fetch user settings: ${response.statusText}`);
  }

  return await response.json();
};

export const updateUserSettings = async (settings) => {
  const response = await makeAuthenticatedRequest(`${USER_SERVICE_URL}/users/settings`, {
    method: 'PUT',
    body: JSON.stringify(settings)
  });

  if (!response.ok) {
    throw new Error(`Failed to update user settings: ${response.statusText}`);
  }

  return await response.json();
};

// Health check utilities
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

// Service startup verification
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

// WebSocket health check
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

// Error handling utilities
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

// Debug utilities
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

export const listAllExports = () => {
  const exports = [
    // Auth functions
    'getAccessToken', 'getAuthToken', 'getRefreshToken',
    'getCurrentUserId', 'getCurrentUserName', 'getCurrentUserEmail', 'getUserEmail', 'getUserRole',
    'getCurrentUser', 'getUserData', 'getUserProfile',
    'setAuthData', 'clearAuthData', 'isAuthenticated',
    'login', 'signup', 'logout', 'changePassword', 'forgotPassword', 'resetPassword',
    'refreshAccessToken', 'refreshAuthToken',

    // User Profile functions
    'fetchUserProfile', 'updateUserProfile', 'uploadAvatar', 'deleteAccount',

    // Message Service functions
    'fetchConversations', 'fetchMessages', 'markMessagesAsRead', 'createConversation',

    // WebSocket functions
    'createWebSocketConnection', 'sendWebSocketMessage', 'closeWebSocketConnection',
    'getWebSocketReadyState', 'isWebSocketConnected', 'sendChatMessage', 'joinConversation',
    'sendTypingIndicator', 'sendReadReceipt', 'sendHeartbeat',

    // Booking Service functions
    'fetchBookings', 'fetchContractorBookings', 'fetchBookingById', 'createBooking',
    'acceptBooking', 'rejectBooking', 'cancelBooking', 'completeBooking', 'startService',
    'addBookingReview', 'reportNoShow', 'reportDispute',

    // Service Management functions
    'fetchServices', 'fetchServiceById', 'searchServices', 'fetchServicesByCategory',
    'fetchFeaturedServices', 'fetchTopRatedServices', 'fetchContractorServices',
    'createService', 'updateService', 'deleteService', 'approveService',

    // Notification and Settings functions
    'fetchNotifications', 'markNotificationAsRead', 'markAllNotificationsAsRead',
    'updateNotificationSettings', 'fetchUserSettings', 'updateUserSettings',

    // Utility functions
    'checkServiceHealth', 'checkAllServicesHealth', 'verifyRequiredServices', 'checkWebSocketHealth',
    'handleApiError', 'debugAuthState', 'listAllExports'
  ];

  console.log('📋 Available API exports:', exports);
  return exports;
};