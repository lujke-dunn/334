// Create a file called src/utils/api.js

const API_BASE_URL = 'http://localhost:8080/api';

// Generic API call function
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
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

// Login function
export async function login(email, password) {
  const response = await apiCall('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
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
  });
  
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
    });
    
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
  });
  
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

// Logout function
export function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userEmail');
  window.location.href = '/login';
}

export default apiCall;