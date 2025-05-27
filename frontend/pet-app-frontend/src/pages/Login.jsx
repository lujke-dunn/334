import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Login.css';
import doggyBackground from '../assets/doggy_.jpg'
import doggyLogo from '../assets/logo.png'

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for success message from registration
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the location state to avoid showing the message after refresh
      window.history.replaceState({}, document.title);
    }
  }, []);
  
  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!password) {
      setError('Password is required');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Call the login API
      const response = await fetch('http://localhost:8080/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        }),
      });
      
      if (!response.ok) {
        if (response.status === 404 || response.status === 401) {
          throw new Error('Invalid email or password');
        }
        throw new Error('Login failed. Please try again.');
      }
      
      const data = await response.json();
      
      // Store tokens and user role
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userEmail', email.trim());
      
      // Handle "Remember me" functionality
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email.trim());
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      // Navigate to dashboard
      navigate('/dashboard');
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  
  return (
    <div className="login-page">
      {/* Left pane with image */}
      <div className="image-pane">
        <img 
          src={doggyBackground}
          alt="doggy" 
          className="hero-image" 
        />
        <div className="image-overlay"></div>
        
        <div className="floating-elements">
          <div className="floating-logo">
            <img
              src={doggyLogo}
              alt="petlogo"
              className="small-logo"
            />
          </div>
          
          <div className="image-caption">
            <h1 className="caption-title">Find the best care for your furry friends</h1>
            <p className="caption-text">Connect with trusted pet care providers in your area and book services with ease.</p>
          </div>
        </div>
      </div>
      
      {/* Right pane with login form */}
      <div className="form-pane">
        <div className="login-container">
          <div className="login-header">
            <h1 className="login-title">Login</h1>
            <p className="login-subtitle">Welcome back! Please login to your account.</p>
          </div>
          
          {successMessage && (
            <div className="success-message">
              <span className="message-icon">✓</span>
              {successMessage}
            </div>
          )}
          
          {error && (
            <div className="error-message">
              <span className="message-icon">!</span>
              {error}
            </div>
          )}
          
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input 
                type="email" 
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email" 
                className="form-input" 
                required 
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="password-field">
                <input 
                  type={showPassword ? "text" : "password"}
                  id="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password" 
                  className="form-input" 
                  required 
                  disabled={loading}
                />
                <button 
                  type="button"
                  className="toggle-password"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <div className="form-options">
              <div className="remember-me">
                <div className="checkbox-container">
                  <input 
                    type="checkbox" 
                    id="remember" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="checkbox-input"
                    disabled={loading}
                  />
                  <label htmlFor="remember" className="checkbox-label">Remember me</label>
                </div>
              </div>
              
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>
            
            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner"></span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          
          <div className="signup-link">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;