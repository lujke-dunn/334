import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRole, getUserEmail, isAuthenticated, changePassword, logout } from '../utils/api';
import '../styles/Profile.css';


const Profile = () => {
  const [userRole, setUserRole] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userProfile, setUserProfile] = useState({
    name: '',
    location: '',
    phone: '',
    profileCompleted: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    location: '',
    phone: '',
    bio: '',
    services: []
  });
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    const role = getUserRole();
    const email = getUserEmail();
    setUserRole(role);
    setUserEmail(email);
    
    // Load user profile data
    loadProfileData(email);
    
    // Set user profile for sidebar
    setUserProfile({
      name: email.split('@')[0],
      location: 'Sydney, NSW',
      phone: '+61 400 000 000',
      profileCompleted: true
    });
  }, [navigate]);
  
  const loadProfileData = async (email) => {
    try {
      setLoading(true);
      // In a real app, this would call your user profile API
      // For now, we'll use mock data based on the email
      setProfileData({
        name: email.split('@')[0],
        email: email,
        location: 'Sydney, NSW',
        phone: '+61 400 000 000',
        bio: `${userRole === 'CONTRACTOR' ? 'Professional pet care provider' : 'Pet owner'} since 2023`,
        services: userRole === 'CONTRACTOR' ? ['Dog Walking', 'Pet Sitting'] : []
      });
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      // In a real app, this would call your update profile API
      console.log('Saving profile:', profileData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      await changePassword(userEmail, passwordData.oldPassword, passwordData.newPassword);
      
      setSuccessMessage('Password changed successfully!');
      setIsChangingPassword(false);
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // In a real app, this would call delete account API
      console.log('Deleting account...');
      logout();
    }
  };
  
  const handleLogout = () => {
    logout();
  };
  
  if (loading && !profileData.email) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }
  
  return (
    <div className="profile-page">
      {/* Sidebar Profile */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-profile">
          <div className="profile-avatar-large">
            <span>{userProfile.name.charAt(0).toUpperCase()}</span>
          </div>
          <h3 className="profile-name">{userProfile.name}</h3>
          <p className="profile-role">{userRole.toLowerCase()}</p>
          <p className="profile-email">{userEmail}</p>
          
          {userProfile.location && (
            <div className="profile-location">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="m7.539 14.841.003.003.002.002a.755.755 0 0 0 .912 0l.002-.002.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.588 15.588 0 0 0 2.046-2.082c1.101-1.362 2.291-3.342 2.291-5.597A5 5 0 0 0 3 7c0 2.255 1.19 4.235 2.292 5.597a15.591 15.591 0 0 0 2.046 2.082 8.916 8.916 0 0 0 .189.153l.012.01ZM8 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" clipRule="evenodd"></path>
              </svg>
              <span>{userProfile.location}</span>
            </div>
          )}
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className="nav-button"
            onClick={() => navigate('/dashboard')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>
            </svg>
            Overview
          </button>
          
          {userRole === 'CONTRACTOR' && (
            <>
              <button 
                className="nav-button"
                onClick={() => navigate('/dashboard')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7.5 3.75A1.75 1.75 0 019.25 2h1.5A1.75 1.75 0 0112.5 3.75v.443c.572.055 1.138.192 1.687.404a1.75 1.75 0 01.744 2.856l-.755.755c-.42.42-1.101.42-1.521 0l-.832-.832a2.5 2.5 0 00-3.536 0l-.832.832c-.42.42-1.101.42-1.521 0l-.755-.755a1.75 1.75 0 01.744-2.856c.549-.212 1.115-.349 1.687-.404V3.75z"></path>
                </svg>
                My Services
              </button>
              <button 
                className="nav-button"
                onClick={() => navigate('/dashboard')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.75 9.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z"></path>
                  <path fillRule="evenodd" d="M3 5.25C3 3.45 4.46 2 6.25 2h7.5C15.54 2 17 3.45 17 5.25v9.5c0 1.8-1.46 3.25-3.25 3.25h-7.5C4.46 18 3 16.55 3 15.75v-9.5zM6.25 3.5A1.75 1.75 0 004.5 5.25v9.5c0 .97.78 1.75 1.75 1.75h7.5c.97 0 1.75-.78 1.75-1.75v-9.5c0-.97-.78-1.75-1.75-1.75h-7.5z" clipRule="evenodd"></path>
                </svg>
                Bookings
              </button>
            </>
          )}
          
          <button 
            className="nav-button active"
            onClick={() => navigate('/profile')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z"></path>
            </svg>
            Profile
          </button>
          
          <button className="nav-button logout-button" onClick={handleLogout}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd"></path>
              <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114L8.704 10.75H18.25A.75.75 0 0019 10z" clipRule="evenodd"></path>
            </svg>
            Sign Out
          </button>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <button onClick={() => navigate('/dashboard')} className="back-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L4.414 9H17a1 1 0 110 2H4.414l5.293 5.293a1 1 0 010 1.414z" clipRule="evenodd"></path>
            </svg>
            Back to Dashboard
          </button>
          <h1>Profile</h1>
        </header>
        
        <div className="dashboard-content">
          <div className="profile-content">
          {error && (
            <div className="error-message">
              <span className="message-icon">!</span>
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="success-message">
              <span className="message-icon">✓</span>
              {successMessage}
            </div>
          )}
          
          <div className="profile-card">
            <div className="profile-header-section">
              <div className="profile-avatar">
                <span>{profileData.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="profile-info">
                <h2>{profileData.name}</h2>
                <p className="profile-role">{userRole.toLowerCase()}</p>
              </div>
              <div className="profile-actions">
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="edit-button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z"></path>
                      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z"></path>
                    </svg>
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
            
            <div className="profile-details">
              <div className="form-grid">
                <div className="form-group">
                  <label>Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="form-input"
                    />
                  ) : (
                    <p className="form-value">{profileData.name}</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  <p className="form-value">{profileData.email}</p>
                </div>
                
                <div className="form-group">
                  <label>Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="form-input"
                    />
                  ) : (
                    <p className="form-value">{profileData.location}</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="form-input"
                    />
                  ) : (
                    <p className="form-value">{profileData.phone}</p>
                  )}
                </div>
                
                <div className="form-group full-width">
                  <label>Bio</label>
                  {isEditing ? (
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      className="form-input"
                      rows="3"
                    />
                  ) : (
                    <p className="form-value">{profileData.bio}</p>
                  )}
                </div>
                
                {userRole === 'CONTRACTOR' && profileData.services.length > 0 && (
                  <div className="form-group full-width">
                    <label>Services</label>
                    <div className="services-tags">
                      {profileData.services.map((service, index) => (
                        <span key={index} className="service-tag">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {isEditing && (
                <div className="form-actions">
                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="save-button"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setError('');
                    }}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="profile-actions-section">
            <div className="action-card">
              <h3>Password & Security</h3>
              <p>Update your password to keep your account secure</p>
              <button
                onClick={() => setIsChangingPassword(true)}
                className="action-button"
              >
                Change Password
              </button>
            </div>
            
            <div className="action-card danger">
              <h3>Delete Account</h3>
              <p>Permanently delete your account and all associated data</p>
              <button
                onClick={handleDeleteAccount}
                className="action-button danger-button"
              >
                Delete Account
              </button>
            </div>
          </div>
          </div>
        </div>
      </main>
      
      {/* Password Change Modal */}
      {isChangingPassword && (
        <div className="modal-overlay" onClick={() => setIsChangingPassword(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Password</h2>
              <button
                onClick={() => setIsChangingPassword(false)}
                className="modal-close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"></path>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
                  className="form-input"
                  placeholder="Enter your current password"
                />
              </div>
              
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  className="form-input"
                  placeholder="Enter your new password"
                />
              </div>
              
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  className="form-input"
                  placeholder="Confirm your new password"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={handleChangePassword}
                disabled={loading}
                className="primary-button"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
              <button
                onClick={() => setIsChangingPassword(false)}
                className="secondary-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;