import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Signup.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    location: '',
    role: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle role selection
  const handleRoleSelect = (role) => {
    setFormData(prev => ({
      ...prev,
      role
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!formData.password) {
      setError('Password is required');
      return;
    }
    
    if (!formData.location.trim()) {
      setError('Location is required');
      return;
    }
    
    if (!formData.role) {
      setError('Please select a role (Customer or Contractor)');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      // In a real implementation, this would call the API
      console.log('Signup form submitted:', formData);
      
      // For now, we'll simulate a successful signup
      setTimeout(() => {
        // Navigate to login page with success message
        navigate('/login', { 
          state: { message: 'Account created successfully! You can now log in.' } 
        });
      }, 1500);
      
    } catch (err) {
      setError('Failed to create account. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-form-container">
          <h1 className="signup-title">Create Account</h1>
          
          {error && (
            <div className="error-message">{error}</div>
          )}
          
          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-group">
              <input 
                type="text" 
                id="name" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name" 
                className="form-input" 
                required 
              />
            </div>
            
            <div className="form-group">
              <input 
                type="email" 
                id="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address" 
                className="form-input" 
                required 
              />
            </div>
            
            <div className="form-group">
              <input 
                type="password" 
                id="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password" 
                className="form-input" 
                required 
              />
            </div>
            
            <div className="form-group">
              <input 
                type="text" 
                id="location" 
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City or Location" 
                className="form-input" 
                required 
              />
            </div>
            
            <div className="role-selector">
              <p className="role-label">I am a:</p>
              <div className="role-options">
                <div 
                  className={`role-option ${formData.role === 'CUSTOMER' ? 'selected' : ''}`}
                  onClick={() => handleRoleSelect('CUSTOMER')}
                >
                  <input 
                    type="radio" 
                    id="customer" 
                    name="role" 
                    value="CUSTOMER"
                    checked={formData.role === 'CUSTOMER'}
                    onChange={handleChange}
                    className="role-input" 
                  />
                  <label htmlFor="customer" className="role-label">Customer</label>
                </div>
                
                <div 
                  className={`role-option ${formData.role === 'CONTRACTOR' ? 'selected' : ''}`}
                  onClick={() => handleRoleSelect('CONTRACTOR')}
                >
                  <input 
                    type="radio" 
                    id="contractor" 
                    name="role" 
                    value="CONTRACTOR"
                    checked={formData.role === 'CONTRACTOR'}
                    onChange={handleChange}
                    className="role-input" 
                  />
                  <label htmlFor="contractor" className="role-label">Contractor</label>
                </div>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="signup-button"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner"></span>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>
          
          <div className="login-redirect">
            <p>Already have an account?</p>
            <Link to="/login" className="login-link">Log in</Link>
          </div>
        </div>
        
        <div className="signup-footer">
          <p className="copyright">© {new Date().getFullYear()} PetApp. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
