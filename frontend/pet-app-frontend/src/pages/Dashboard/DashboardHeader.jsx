import React from 'react';

const DashboardHeader = ({ userRole }) => {
  return (
    <div className="dashboard-header">
      <div className="header-content">
        <h1>
          {userRole === 'CUSTOMER' ? 'Dashboard' : 'Contractor Dashboard'}
        </h1>
        
        {/* Sydney location indicator */}
        <div className="location-indicator">
          <span className="flag">🇦🇺</span>
          <span>Sydney, Australia</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;