import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRole, getUserEmail, logout, isAuthenticated, getAccessToken } from '../../utils/api';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import CustomerDashboard from './CustomerDashboard';
import ContractorDashboard from './ContractorDashboard/ContractorDashboard';
import ChatApp from './Chat/ChatApp';
import CreateServiceModal from './Modals/CreateServiceModal';
import '../../styles/Dashboard.css';
import CustomerBookings from '../CustomerBooking';

const Dashboard = () => {
  const [userRole, setUserRole] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userProfile, setUserProfile] = useState({
    id: null,
    name: '',
    location: '',
    phone: '',
    profileCompleted: false,
    hasServices: false
  });
  const [services, setServices] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCreateServiceModal, setShowCreateServiceModal] = useState(false);
  
  // Reference to store tab-specific data
  const tabDataRef = useRef({
    tabId: null,
    contractorId: null,
    initialized: false
  });
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    // Generate unique tab ID for this specific tab instance
    if (!tabDataRef.current.tabId) {
      tabDataRef.current.tabId = generateTabId();
    }
    
    // Get user details
    const role = getUserRole();
    const email = getUserEmail();
    setUserRole(role);
    setUserEmail(email);
    
    // Initialize user profile for this tab
    initializeTabProfile(email, role);
    
    // Load customer data immediately if customer
    if (role === 'CUSTOMER') {
      loadCustomerDashboard();
      setLoading(false);
    }
    // For contractors, loading will be handled after profile initialization
    
  }, [navigate]);
  
  // Add this useEffect to load contractor data when profile is ready
  useEffect(() => {
    if (userRole === 'CONTRACTOR' && userProfile.id && tabDataRef.current.initialized) {
      console.log('🔄 Profile initialized, loading contractor dashboard...');
      loadContractorDashboard().finally(() => {
        setLoading(false);
      });
    }
  }, [userProfile.id, userRole, tabDataRef.current.initialized]);
  
  // Add this function to generate a unique tab ID
  const generateTabId = () => {
    return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };
  
  const initializeTabProfile = async (email, role) => {
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }
      
      // Get the user ID from UserService with proper auth
      const userId = await getUserFromUserService(email, token);
      
      if (!userId) {
        throw new Error(`Could not find user with email: ${email}`);
      }
      
      // Contractor ID = User ID (simple and clean)
      const contractorId = userId;
      tabDataRef.current.contractorId = contractorId;
      
      const profile = {
        id: contractorId,
        name: email.split('@')[0],
        location: '',
        phone: '',
        profileCompleted: false,
        hasServices: false
      };
      
      setUserProfile(profile);
      tabDataRef.current.initialized = true;
      
      console.log('✅ Profile initialized:', { email, role, contractorId });
      
      if (role === 'CONTRACTOR' && !profile.location) {
        setShowLocationModal(true);
      }
    } catch (error) {
      console.error('❌ Error initializing profile:', error);
      setLoading(false); // Make sure to stop loading even on error
      
      if (error.message.includes('authentication') || error.message.includes('token')) {
        // If it's an auth error, redirect to login
        logout();
        navigate('/login');
      } else {
        alert('Error loading profile. Please try again.');
      }
    }
  };
  
  // Updated function to fetch user with proper authentication
  const getUserFromUserService = async (email, token) => {
    try {
      console.log('🔍 Fetching user:', email);
      const response = await fetch(`http://localhost:8080/api/users/by-email?email=${encodeURIComponent(email)}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication required');
      }
      
      if (!response.ok) {
        console.error('❌ UserService error:', response.status, response.statusText);
        throw new Error(`UserService error: ${response.status}`);
      }
      
      const userData = await response.json();
      console.log('✅ Got user data:', userData);
      return userData.id;
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      throw error;
    }
  };
  
  // Keep getContractorId simple
  const getContractorId = () => {
    const id = userProfile.id || tabDataRef.current.contractorId;
    console.log('getContractorId returning:', id);
    return id;
  };

  const loadCustomerDashboard = async () => {
    try {
      const servicesResponse = await fetch('http://localhost:8082/api/services');
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setServices(servicesData.slice(0, 6));
      }
      
      const contractorsResponse = await fetch('http://localhost:8082/api/services/featured');
      if (contractorsResponse.ok) {
        const contractorsData = await contractorsResponse.json();
        setContractors(contractorsData.slice(0, 6));
      }
    } catch (error) {
      console.error('Error loading customer dashboard:', error);
    }
  };
  
  const loadContractorDashboard = async () => {
    try {
      const contractorId = getContractorId();
      if (!contractorId) {
        console.error('❌ No contractor ID available for loading dashboard');
        return;
      }
      
      console.log('🔄 Loading contractor dashboard for ID:', contractorId);
      
      // Load contractor's services
      const response = await fetch(`http://localhost:8082/api/services/contractor/${contractorId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Loaded contractor services:', data);
        setServices(data);
        
        // Update profile with service count
        const updatedProfile = { ...userProfile, hasServices: data.length > 0 };
        setUserProfile(updatedProfile);
      } else {
        console.error('❌ Failed to load contractor services:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error loading contractor dashboard:', error);
    }
  };
  
  // Add refresh function for when services are created/deleted
  const refreshContractorServices = async () => {
    await loadContractorDashboard();
  };
  
  const handleLocationSubmit = async (locationData) => {
    // Save location
    const fullLocation = `${locationData.city}, ${locationData.state}`;
    const updatedProfile = { 
      ...userProfile, 
      location: fullLocation,
      profileCompleted: true
    };
    
    setUserProfile(updatedProfile);
    setShowLocationModal(false);
  };

  const handleCreateService = async (serviceData) => {
    try {
      const contractorId = getContractorId();
      console.log('🏭 Creating service - contractorId:', contractorId);

      if (!contractorId) {
        console.error('No contractor ID available');
        alert('Cannot create service: No contractor ID available');
        return;
      }

      // Force service to be ACTIVE immediately
      const servicePayload = {
        ...serviceData,
        status: 'ACTIVE' // Make service active right away!
      };

      // Get authentication headers
      const token = getAccessToken();
      const headers = {
        'Content-Type': 'application/json',
        'X-Contractor-ID': contractorId.toString(),
        'X-Contractor-Name': userProfile.name,
        'X-Contractor-Email': userEmail
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('📤 Request headers:', headers);
      console.log('📤 Request body:', servicePayload);

      const response = await fetch('http://localhost:8082/api/services', {
        method: 'POST',
        headers,
        body: JSON.stringify(servicePayload)
      });

      console.log('📥 Create response status:', response.status);

      if (response.ok) {
        const newService = await response.json();
        console.log('✅ Service created successfully and is ACTIVE:', newService);

        // If the service isn't active yet, approve it immediately
        if (newService.status === 'PENDING') {
          console.log('🔄 Service is pending, approving now...');
          try {
            const approveResponse = await fetch(`http://localhost:8082/api/services/${newService.id}/approve`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (approveResponse.ok) {
              const approvedService = await approveResponse.json();
              console.log('✅ Service approved and activated:', approvedService);

              // Add the approved service to the list immediately
              setServices(prevServices => [...prevServices, approvedService]);
            } else {
              console.warn('⚠️ Failed to approve service, but adding pending service');
              setServices(prevServices => [...prevServices, newService]);
            }
          } catch (approveError) {
            console.error('❌ Error approving service:', approveError);
            // Still add the service even if approval failed
            setServices(prevServices => [...prevServices, newService]);
          }
        } else {
          // Service is already active, add it to the list
          setServices(prevServices => [...prevServices, newService]);
        }

        // Close modal and show success
        setShowCreateServiceModal(false);
        alert('✅ Service created and activated successfully! It\'s now available for bookings.');

        // Update profile to show user has services
        setUserProfile(prev => ({ ...prev, hasServices: true }));

      } else {
        const error = await response.text();
        console.error('❌ Failed to create service:', error);
        alert('Failed to create service. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error creating service:', error);
      alert('Error creating service. Please check your connection and try again.');
    }
  };
  
  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    
    try {
      const contractorId = getContractorId();
      if (!contractorId) {
        console.error('No contractor ID available');
        return;
      }
      
      const token = getAccessToken();
      const headers = {
        'X-Contractor-ID': contractorId.toString()
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`http://localhost:8082/api/services/${serviceId}`, {
        method: 'DELETE',
        headers
      });
      
      if (response.ok) {
        // Refresh the contractor dashboard to get updated services
        refreshContractorServices();
      } else {
        console.error('Failed to delete service');
        alert('Failed to delete service. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Error deleting service. Please check your connection and try again.');
    }
  };
  
  const handleLogout = () => {
    // Clear tab-specific data
    tabDataRef.current = {
      tabId: null,
      contractorId: null,
      initialized: false
    };
    
    logout();
  };
  
  const handleSearch = async (searchTerm) => {
    if (!searchTerm.trim()) return;
    
    try {
      const response = await fetch(`http://localhost:8082/api/services/search?searchTerm=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Error searching services:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        if (userRole === 'CUSTOMER') {
          return <CustomerDashboard services={services} contractors={contractors} />;
        } else {
          return (
              <ContractorDashboard
                  services={services}
                  activeTab={activeTab}
                  userProfile={userProfile}
                  onLocationUpdate={() => setShowLocationModal(true)}
                  onCreateService={() => setShowCreateServiceModal(true)}
                  onDeleteService={handleDeleteService}
              />
          );
        }
      case 'services':
        return (
            <ContractorDashboard
                services={services}
                activeTab={activeTab}
                userProfile={userProfile}
                onLocationUpdate={() => setShowLocationModal(true)}
                onCreateService={() => setShowCreateServiceModal(true)}
                onDeleteService={handleDeleteService}
            />
        );
      case 'bookings':
        // FIX: Handle bookings based on user role
        if (userRole === 'CUSTOMER') {
          // Import CustomerBookings component and use it
          return <CustomerBookings userEmail={userEmail} />;
        } else {
          return (
              <ContractorDashboard
                  services={services}
                  activeTab={activeTab}
                  userProfile={userProfile}
                  onLocationUpdate={() => setShowLocationModal(true)}
                  onCreateService={() => setShowCreateServiceModal(true)}
                  onDeleteService={handleDeleteService}
              />
          );
        }
      case 'chat':
        return <ChatApp />;
      case 'profile':
        return <div>Profile content coming soon...</div>;
      default:
        return renderContent();
    }
  };
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }
  
  return (
    <div className="dashboard">
      <DashboardSidebar
        userProfile={userProfile}
        userRole={userRole}
        userEmail={userEmail}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        navigate={navigate}
        tabId={tabDataRef.current.tabId}
      />
      
      <main className="dashboard-main">
        <DashboardHeader
          userRole={userRole}
          onSearch={handleSearch}
        />
        
        <div className="dashboard-content">
          {renderContent()}
        </div>
      </main>
      
      {showCreateServiceModal && ( 
        <CreateServiceModal
          userProfile={userProfile}
          onSubmit={handleCreateService}
          onClose={() => setShowCreateServiceModal(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;