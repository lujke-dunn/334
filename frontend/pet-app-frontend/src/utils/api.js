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

  // Construct WebSocket URL
  const wsUrl = `ws://localhost:8084/ws/chat?userId=${userId}&userRole=${userRole}`;

  console.log('Connecting to WebSocket:', wsUrl);

  const websocket = new WebSocket(wsUrl);

  websocket.onopen = (event) => {
    console.log('WebSocket connected successfully');

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

// Service Management API calls
export const fetchServices = async (page = 0, size = 20) => {
  const response = await fetch(`${SERVICE_MANAGEMENT_URL}/services?page=${page}&size=${size}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch services: ${response.statusText}`);
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

// Health check utilities
export const checkServiceHealth = async (serviceName, port) => {
  try {
    const response = await fetch(`http://localhost:${port}/api/test/health`);
    return response.ok;
  } catch (error) {
    console.error(`Health check failed for ${serviceName}:`, error);
    return false;
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
    services.map(async (service) => ({
      ...service,
      healthy: await checkServiceHealth(service.name, service.port)
    }))
  );

  return healthChecks;
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
    'getAccessToken', 'getAuthToken', 'getRefreshToken',
    'getCurrentUserId', 'getCurrentUserName', 'getCurrentUserEmail', 'getUserEmail', 'getUserRole',
    'getCurrentUser', 'getUserData', 'getUserProfile',
    'setAuthData', 'clearAuthData', 'isAuthenticated',
    'login', 'refreshAccessToken',
    'fetchConversations', 'fetchMessages', 'markMessagesAsRead', 'createConversation',
    'createWebSocketConnection',
    'fetchBookings', 'createBooking',
    'fetchServices', 'searchServices',
    'checkServiceHealth', 'checkAllServicesHealth',
    'handleApiError', 'debugAuthState', 'listAllExports'
  ];

  console.log('📋 Available API exports:', exports);
  return exports;
};