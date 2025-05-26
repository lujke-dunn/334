import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRole, getUserEmail, isAuthenticated, changePassword, logout } from '../utils/api';
import DashboardSidebar from '../pages/Dashboard/DashboardSidebar.jsx';
import '../styles/Profile.css';

const Profile = () => {
  const [userRole, setUserRole] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userProfile, setUserProfile] = useState({
    id: '',
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
      id: localStorage.getItem('userId') || '1',
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

      // Update the sidebar profile data
      setUserProfile(prev => ({
        ...prev,
        name: profileData.name,
        location: profileData.location
      }));

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

  // Mock active tab state (profile is always active on this page)
  const activeTab = 'profile';
  const setActiveTab = (tab) => {
    if (tab === 'overview' || tab === 'services' || tab === 'bookings' || tab === 'chat') {
      navigate('/dashboard');
    }
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
        {/* Use the same DashboardSidebar component */}
        <DashboardSidebar
            userProfile={userProfile}
            userRole={userRole}
            userEmail={userEmail}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLogout={handleLogout}
            navigate={navigate}
            tabId="profile-tab"
        />

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