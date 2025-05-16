import React from 'react';

const DashboardSidebar = ({
  userProfile,
  userRole,
  userEmail,
  activeTab,
  setActiveTab,
  onLogout,
  navigate,
  tabId
}) => {
  return (
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
        
        {/* Display current tab info for debugging */}
        <div style={{ marginTop: '1rem', fontSize: '0.75rem', opacity: 0.7 }}>
          Tab: {tabId?.split('-')[2] || 'loading...'}
          <br />
          Contractor ID: {userProfile.id}
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <button 
          className={`nav-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>
          </svg>
          Overview
        </button>
        
        {userRole === 'CONTRACTOR' && (
          <>
            <button 
              className={`nav-button ${activeTab === 'services' ? 'active' : ''}`}
              onClick={() => setActiveTab('services')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7.5 3.75A1.75 1.75 0 019.25 2h1.5A1.75 1.75 0 0112.5 3.75v.443c.572.055 1.138.192 1.687.404a1.75 1.75 0 01.744 2.856l-.755.755c-.42.42-1.101.42-1.521 0l-.832-.832a2.5 2.5 0 00-3.536 0l-.832.832c-.42.42-1.101.42-1.521 0l-.755-.755a1.75 1.75 0 01.744-2.856c.549-.212 1.115-.349 1.687-.404V3.75z"></path>
              </svg>
              My Services
            </button>
            <button 
              className={`nav-button ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.75 9.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z"></path>
                <path fillRule="evenodd" d="M3 5.25C3 3.45 4.46 2 6.25 2h7.5C15.54 2 17 3.45 17 5.25v9.5c0 1.8-1.46 3.25-3.25 3.25h-7.5C4.46 18 3 16.55 3 15.75v-9.5zM6.25 3.5A1.75 1.75 0 004.5 5.25v9.5c0 .97.78 1.75 1.75 1.75h7.5c.97 0 1.75-.78 1.75-1.75v-9.5c0-.97-.78-1.75-1.75-1.75h-7.5z" clipRule="evenodd"></path>
              </svg>
              Bookings
            </button>
          </>
        )}

        {/* Chat button - available for both customers and contractors */}
        <button 
          className={`nav-button ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902 1.168.188 2.352.327 3.55.414.28.02.521.18.642.413l1.713 3.293a.75.75 0 001.33 0l1.713-3.293a.783.783 0 01.642-.413 41.102 41.102 0 003.55-.414c1.437-.231 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2zM6.75 6a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 2.5a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z" clipRule="evenodd"></path>
          </svg>
          Chat
          {/* Show notification badge for unread messages */}
          <span className="nav-notification-badge">3</span>
        </button>

        {/* Customer specific navigation */}
        {userRole === 'CUSTOMER' && (
          <button 
            className={`nav-button ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.75 9.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z"></path>
              <path fillRule="evenodd" d="M3 5.25C3 3.45 4.46 2 6.25 2h7.5C15.54 2 17 3.45 17 5.25v9.5c0 1.8-1.46 3.25-3.25 3.25h-7.5C4.46 18 3 16.55 3 15.75v-9.5zM6.25 3.5A1.75 1.75 0 004.5 5.25v9.5c0 .97.78 1.75 1.75 1.75h7.5c.97 0 1.75-.78 1.75-1.75v-9.5c0-.97-.78-1.75-1.75-1.75h-7.5z" clipRule="evenodd"></path>
            </svg>
            My Bookings
          </button>
        )}
        
        <button 
          className={`nav-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => navigate('/profile')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z"></path>
          </svg>
          Profile
        </button>
        
        <button className="nav-button logout-button" onClick={onLogout}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd"></path>
            <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114L8.704 10.75H18.25A.75.75 0 0019 10z" clipRule="evenodd"></path>
          </svg>
          Sign Out
        </button>
      </nav>
    </aside>
  );
};

export default DashboardSidebar;