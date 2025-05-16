import React from 'react';
import ContractorOverview from './ContractorOverview';
import ContractorServices from './ContractorServices';
import ContractorBookings from './ContractorBookings';

const ContractorDashboard = ({ 
  services, 
  activeTab, 
  userProfile, 
  onLocationUpdate, 
  onCreateService, 
  onDeleteService 
}) => {
  if (activeTab === 'overview') {
    return (
      <ContractorOverview
        services={services}
        userProfile={userProfile}
        onLocationUpdate={onLocationUpdate}
      />
    );
  }
  
  if (activeTab === 'services') {
    return (
      <ContractorServices
        services={services}
        onCreateService={onCreateService}
        onDeleteService={onDeleteService}
      />
    );
  }
  
  if (activeTab === 'bookings') {
    return <ContractorBookings contractorId={userProfile.id} />;
  }
  
  return null;
};

export default ContractorDashboard;