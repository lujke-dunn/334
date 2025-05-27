import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './utils/api';
import { ChatProvider } from './contexts/ChatContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard/Dashboard';
import Profile from './pages/Profile';
import ProtectedRoute from './pages/ProtectedRoute';
import './App.css';

// Redirect component for root path
const RootRedirect = () => {
  return isAuthenticated() ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <ChatProvider>
          <Routes>
            {/* Root path - redirect based on auth status */}
            <Route path="/" element={<RootRedirect />} />
          
            {/* Login route */}
            <Route path="/login" element={<Login />} />
            
            {/* Signup route */}
            <Route path="/signup" element={<Signup />} />
          
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
          
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
          
            {/* Catch all route - redirect to dashboard or login */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </ChatProvider> 
      </div>
    </Router>
  );
}

export default App;