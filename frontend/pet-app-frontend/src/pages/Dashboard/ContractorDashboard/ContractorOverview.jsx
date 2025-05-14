import React from 'react';

const ContractorOverview = ({ services, userProfile, onLocationUpdate }) => {
  return (
    <>
      {/* Profile Completion Alert */}
      {!userProfile.profileCompleted && (
        <div className="alert-banner">
          <div className="alert-content">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd"></path>
            </svg>
            <div>
              <h3>Complete Your Profile</h3>
              <p>Add your location to start offering services to customers.</p>
            </div>
            <button onClick={onLocationUpdate} className="alert-button">
              Set Location
            </button>
          </div>
        </div>
      )}
      
      <section className="welcome-section">
        <h1>Welcome back, {userProfile.name}!</h1>
        <p>Manage your pet care services and connect with customers</p>
      </section>
      
      <section className="dashboard-section">
        <div className="contractor-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3.5A1.5 1.5 0 018.5 2h3A1.5 1.5 0 0113 3.5v.5h1.5A1.5 1.5 0 0116 5.5v.5h1.25A.75.75 0 0118 7v12a1 1 0 01-1 1H3a1 1 0 01-1-1V7a.75.75 0 01.75-.75H4v-.5A1.5 1.5 0 015.5 4H7v-.5zM7 5v.5h6V5H7z" />
              </svg>
            </div>
            <div className="stat-content">
              <h3>Total Services</h3>
              <p className="stat-number">{services.length}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655z" />
              </svg>
            </div>
            <div className="stat-content">
              <h3>Active Customers</h3>
              <p className="stat-number">0</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.202.592.037.051.08.102.128.152z" />
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a.75.75 0 01.75.75v.316a3.78 3.78 0 011.653.713c.426.33.744.74.925 1.2a.75.75 0 01-1.395.55 1.35 1.35 0 00-.447-.563 2.187 2.187 0 00-.736-.363V9.3c.698.093 1.383.32 1.959.696.787.514 1.29 1.27 1.29 2.13 0 .86-.504 1.616-1.29 2.13-.576.377-1.261.603-1.959.696v.299a.75.75 0 11-1.5 0v-.3c-.697-.092-1.382-.318-1.958-.695C5.896 13.747 5.392 12.99 5.392 12.13s.504-1.616 1.29-2.13c.577-.377 1.261-.603 1.958-.696V6.75A.75.75 0 0110 4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="stat-content">
              <h3>Total Earnings</h3>
              <p className="stat-number">$0</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="stat-content">
              <h3>Completed Jobs</h3>
              <p className="stat-number">0</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Recent Activity */}
      <section className="dashboard-section">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          <div className="activity-item empty">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2.5 3A1.5 1.5 0 004 1.5h12A1.5 1.5 0 0017.5 3v11.5A1.5 1.5 0 0016 16H4a1.5 1.5 0 01-1.5-1.5V3zm2 1.5a.5.5 0 000 1h11a.5.5 0 000-1h-11zm0 2.5a.5.5 0 000 1h11a.5.5 0 000-1h-11zm0 2.5a.5.5 0 000 1h11a.5.5 0 000-1h-11z" clipRule="evenodd" />
            </svg>
            <div>
              <h3>No recent activity</h3>
              <p>Start by creating your first service!</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ContractorOverview;