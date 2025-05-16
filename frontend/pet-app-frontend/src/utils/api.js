const USER_SERVICE_URL = 'http://localhost:8080/api';
const MESSAGE_SERVICE_URL = 'http://localhost:8084/api';

// Generic API call function with service-specific URL
async function apiCall(endpoint, options = {}, serviceUrl = USER_SERVICE_URL) {
  const url = `${serviceUrl}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
  
  // Add authorization header if token exists
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, config);
    
    // Handle unauthorized requests (expired token)
    if (response.status === 401) {
      // Try to refresh token
      const refreshed = await refreshAuthToken();
      if (refreshed) {
        // Retry the original request with new token
        config.headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;
        return fetch(url, config);
      } else {
        // Refresh failed, redirect to login
        localStorage.clear();
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
    }
    
    return response;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// ===== USER SERVICE FUNCTIONS (Port 8080) =====

// Login function
export async function login(email, password) {
  const response = await apiCall('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, USER_SERVICE_URL);
  
  if (!response.ok) {
    if (response.status === 404 || response.status === 401) {
      throw new Error('Invalid email or password');
    }
    throw new Error('Login failed. Please try again.');
  }
  
  return response.json();
}

// Signup function
export async function signup(userData) {
  const response = await apiCall('/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  }, USER_SERVICE_URL);
  
  if (!response.ok) {
    if (response.status === 400) {
      throw new Error('Invalid data provided');
    }
    throw new Error('Signup failed. Please try again.');
  }
  
  return response.json();
}

// Refresh token function
export async function refreshAuthToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    return false;
  }
  
  try {
    const response = await apiCall('/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }, USER_SERVICE_URL);
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('userRole', data.role);
      return true;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }
  
  return false;
}

// Change password function
export async function changePassword(email, oldPassword, newPassword) {
  const response = await apiCall('/change-password', {
    method: 'POST',
    body: JSON.stringify({ email, oldPassword, newPassword }),
  }, USER_SERVICE_URL);
  
  if (!response.ok) {
    if (response.status === 400) {
      throw new Error('Old password is incorrect');
    }
    throw new Error('Failed to change password');
  }
  
  return response.json();
}

// Check if user is authenticated
export function isAuthenticated() {
  const token = localStorage.getItem('accessToken');
  return !!token;
}

// Get user role
export function getUserRole() {
  return localStorage.getItem('userRole');
}

// Get user email
export function getUserEmail() {
  return localStorage.getItem('userEmail');
}

// Get access token
export function getAccessToken() {
  return localStorage.getItem('accessToken');
}

// Logout function
export function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  window.location.href = '/login';
}

// Get user ID from localStorage
export function getCurrentUserId() {
  return localStorage.getItem('userId');
}

// Get user name from localStorage
export function getCurrentUserName() {
  return localStorage.getItem('userName');
}

// Store user info after login (call this in your login flow)
export function storeUserInfo(userInfo) {
  localStorage.setItem('userId', userInfo.id);
  localStorage.setItem('userName', userInfo.name);
  localStorage.setItem('userEmail', userInfo.email);
  localStorage.setItem('userRole', userInfo.role);
}

// ===== MESSAGE SERVICE FUNCTIONS (Port 8084) =====

// Fetch conversations for a user
export async function fetchConversations(page = 0, size = 20) {
  const response = await apiCall(`/conversations?page=${page}&size=${size}`, {}, MESSAGE_SERVICE_URL);
  
  if (!response.ok) {
    throw new Error('Failed to fetch conversations');
  }
  
  return response.json();
}

// Fetch messages for a specific conversation
export async function fetchMessages(conversationId, page = 0, size = 50) {
  const response = await apiCall(`/conversations/${conversationId}/messages?page=${page}&size=${size}`, {}, MESSAGE_SERVICE_URL);
  
  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }
  
  return response.json();
}

// Mark conversation messages as read
export async function markMessagesAsRead(conversationId) {
  const response = await apiCall(`/conversations/${conversationId}/read`, {
    method: 'PUT',
  }, MESSAGE_SERVICE_URL);
  
  if (!response.ok) {
    throw new Error('Failed to mark messages as read');
  }
  
  return response.ok;
}

// ===== WEBSOCKET CONNECTION (Port 8084) =====

// Enhanced WebSocket connection helper for message service
export function createWebSocketConnection(onMessage, onError, onClose) {
  const token = getAccessToken();
  
  // Try multiple connection methods with message service port
  let socket;
  
  // First, try SockJS connection (recommended)
  try {
    // Use SockJS with message service port
    if (typeof SockJS !== 'undefined') {
      socket = new SockJS('http://localhost:8084/ws/chat');
    } else {
      // Fallback to direct WebSocket
      socket = new WebSocket(`ws://localhost:8084/ws/chat`);
    }
  } catch (error) {
    console.error('WebSocket connection failed:', error);
    if (onError) onError(new Error('WebSocket connection failed'));
    return null;
  }
  
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectInterval = 3000;
  
  socket.onopen = () => {
    console.log('WebSocket connected successfully to message service (8084)');
    reconnectAttempts = 0;
    
    // Send authentication if needed
    if (token) {
      try {
        socket.send(JSON.stringify({
          type: 'AUTH',
          token: token,
          userId: getCurrentUserId(),
          userRole: getUserRole()
        }));
      } catch (error) {
        console.error('Error sending auth message:', error);
      }
    }
  };
  
  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      if (onMessage) onMessage(message);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (onError) onError(error);
  };
  
  socket.onclose = (event) => {
    console.log('WebSocket closed:', event.code, event.reason);
    
    if (onClose) onClose(event);
    
    // Attempt to reconnect if not a normal closure
    if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      console.log(`Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`);
      
      setTimeout(() => {
        try {
          // Create new connection
          const newSocket = createWebSocketConnection(onMessage, onError, onClose);
          if (newSocket) {
            Object.assign(socket, newSocket);
          }
        } catch (error) {
          console.error('Reconnection failed:', error);
        }
      }, reconnectInterval * reconnectAttempts);
    }
  };
  
  return socket;
}

// ===== CONNECTION TESTING =====

// Test WebSocket connection to message service
export async function testWebSocketConnection() {
  return new Promise((resolve, reject) => {
    // Try SockJS first
    let testSocket;
    
    try {
      if (typeof SockJS !== 'undefined') {
        testSocket = new SockJS('http://localhost:8084/ws/chat');
      } else {
        testSocket = new WebSocket('ws://localhost:8084/ws/chat');
      }
    } catch (error) {
      reject(error);
      return;
    }
    
    const timeout = setTimeout(() => {
      testSocket.close();
      reject(new Error('Connection timeout'));
    }, 5000);
    
    testSocket.onopen = () => {
      clearTimeout(timeout);
      testSocket.close();
      resolve(true);
    };
    
    testSocket.onerror = (error) => {
      clearTimeout(timeout);
      reject(error);
    };
  });
}

// Check if user service is reachable
export async function checkUserServiceConnection() {
  try {
    const response = await fetch('http://localhost:8080/actuator/health', {
      method: 'GET',
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    console.error('User service health check failed:', error);
    return false;
  }
}

// Check if message service is reachable
export async function checkMessageServiceConnection() {
  try {
    const response = await fetch('http://localhost:8084/actuator/health', {
      method: 'GET',
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    console.error('Message service health check failed:', error);
    return false;
  }
}

// Legacy function for backward compatibility
export async function checkBackendConnection() {
  const userService = await checkUserServiceConnection();
  const messageService = await checkMessageServiceConnection();
  return { userService, messageService };
}

export default apiCall;