import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRole, getUserEmail, logout, isAuthenticated, getAccessToken } from '../utils/api';
import '../styles/Dashboard.css';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCreateServiceModal, setShowCreateServiceModal] = useState(false);
  const [locationData, setLocationData] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });
  
  // Service creation form state
  const [serviceForm, setServiceForm] = useState({
    name: '',
    title: '',
    description: '',
    price: '',
    durationMinutes: 60,
    category: 'DOG_WALKING',
    location: '',
    inHomeService: true,
    outHomeService: false,
    emergencyService: false,
    availableDays: [],
    availableHoursStart: '09:00',
    availableHoursEnd: '17:00'
  });
  
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
    
    // Load data based on role
    if (role === 'CUSTOMER') {
      loadCustomerDashboard();
    } else if (role === 'CONTRACTOR') {
      loadContractorDashboard();
    }
    
    setLoading(false);
  }, [navigate]);
  
  // Generate a unique tab ID for this specific tab instance
  const generateTabId = () => {
    return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };
  
  // Get unique contractor ID for this tab
  const getContractorId = () => {
    if (!tabDataRef.current.contractorId) {
      // Generate a unique contractor ID based on email and tab ID
      const tabId = tabDataRef.current.tabId;
      const baseString = `${userEmail}-${tabId}`;
      tabDataRef.current.contractorId = Math.abs(
        baseString.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0)
      );
    }
    return tabDataRef.current.contractorId;
  };
  
  const initializeTabProfile = async (email, role) => {
    try {
      // Create new profile for this tab
      const contractorId = getContractorId();
      
      const profile = {
        id: contractorId,
        name: email.split('@')[0],
        location: '', // Empty initially
        phone: '',
        profileCompleted: false,
        hasServices: false
      };
      
      setUserProfile(profile);
      tabDataRef.current.initialized = true;
      
      // Check if contractor needs to set location
      if (role === 'CONTRACTOR' && !profile.location) {
        setShowLocationModal(true);
      }
    } catch (error) {
      console.error('Error initializing tab profile:', error);
    }
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
        console.error('No contractor ID available');
        return;
      }
      
      // Load contractor's services
      const response = await fetch(`http://localhost:8082/api/services/contractor/${contractorId}`);
      if (response.ok) {
        const data = await response.json();
        setServices(data);
        
        // Update profile with service count
        const updatedProfile = { ...userProfile, hasServices: data.length > 0 };
        setUserProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error loading contractor dashboard:', error);
    }
  };
  
  const handleLocationSubmit = async () => {
    // Save location
    const fullLocation = `${locationData.city}, ${locationData.state}`;
    const updatedProfile = { 
      ...userProfile, 
      location: fullLocation,
      profileCompleted: true
    };
    
    setUserProfile(updatedProfile);
    
    // Update service form location
    setServiceForm(prev => ({
      ...prev,
      location: fullLocation
    }));
    
    setShowLocationModal(false);
  };
  
  const handleCreateService = async () => {
    try {
      const contractorId = getContractorId();
      if (!contractorId) {
        console.error('No contractor ID available');
        return;
      }
      
      // Prepare service data
      const serviceData = {
        ...serviceForm,
        price: parseFloat(serviceForm.price)
      };
      
      // Get authentication headers
      const token = getAccessToken();
      const headers = {
        'Content-Type': 'application/json',
        'X-Contractor-ID': contractorId.toString(),
        'X-Contractor-Name': userProfile.name,
        'X-Contractor-Email': userEmail
      };
      
      // Add authorization header if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('http://localhost:8082/api/services', {
        method: 'POST',
        headers,
        body: JSON.stringify(serviceData)
      });
      
      if (response.ok) {
        const newService = await response.json();
        setServices(prev => [...prev, newService]);
        
        // Update profile
        const updatedProfile = { ...userProfile, hasServices: true };
        setUserProfile(updatedProfile);
        
        setShowCreateServiceModal(false);
        resetServiceForm();
        
        // Refresh services list
        loadContractorDashboard();
      } else {
        const error = await response.text();
        console.error('Failed to create service:', error);
        alert('Failed to create service. Please try again.');
      }
    } catch (error) {
      console.error('Error creating service:', error);
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
        setServices(prev => prev.filter(service => service.id !== serviceId));
        loadContractorDashboard();
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
  
  const handleSearch = async (e) => {
    e.preventDefault();
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
  
  const resetServiceForm = () => {
    setServiceForm({
      name: '',
      title: '',
      description: '',
      price: '',
      durationMinutes: 60,
      category: 'DOG_WALKING',
      location: userProfile.location || '',
      inHomeService: true,
      outHomeService: false,
      emergencyService: false,
      availableDays: [],
      availableHoursStart: '09:00',
      availableHoursEnd: '17:00'
    });
  };
  
  const handleDayToggle = (day) => {
    setServiceForm(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }));
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
          
          {/* Display current tab info for debugging */}
          <div style={{ marginTop: '1rem', fontSize: '0.75rem', opacity: 0.7 }}>
            Tab: {tabDataRef.current.tabId?.split('-')[2] || 'loading...'}
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
          
          <button 
            className={`nav-button ${activeTab === 'profile' ? 'active' : ''}`}
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
          <h1>Pet App</h1>
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder={userRole === 'CUSTOMER' ? 'Search for services...' : 'Search your services...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd"></path>
              </svg>
            </button>
          </form>
        </header>
        
        <div className="dashboard-content">
          {userRole === 'CUSTOMER' ? (
            <CustomerDashboard services={services} contractors={contractors} />
          ) : (
            <ContractorDashboard 
              services={services} 
              activeTab={activeTab}
              userProfile={userProfile}
              onLocationUpdate={() => setShowLocationModal(true)}
              onCreateService={() => setShowCreateServiceModal(true)}
              onDeleteService={handleDeleteService}
            />
          )}
        </div>
      </main>
      
      {/* Location Setup Modal */}
      {showLocationModal && (
        <div className="modal-overlay" onClick={() => setShowLocationModal(false)}>
          <div className="modal-content location-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Set Your Location</h2>
              <p>To start offering services, please set your service location.</p>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Street Address</label>
                <input
                  type="text"
                  value={locationData.address}
                  onChange={(e) => setLocationData({...locationData, address: e.target.value})}
                  className="form-input"
                  placeholder="123 Main Street"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={locationData.city}
                    onChange={(e) => setLocationData({...locationData, city: e.target.value})}
                    className="form-input"
                    placeholder="Sydney"
                  />
                </div>
                
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    value={locationData.state}
                    onChange={(e) => setLocationData({...locationData, state: e.target.value})}
                    className="form-input"
                    placeholder="NSW"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Postal Code</label>
                <input
                  type="text"
                  value={locationData.zipCode}
                  onChange={(e) => setLocationData({...locationData, zipCode: e.target.value})}
                  className="form-input"
                  placeholder="2000"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={handleLocationSubmit}
                className="primary-button"
                disabled={!locationData.city || !locationData.state}
              >
                Save Location
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Create Service Modal */}
      {showCreateServiceModal && (
        <div className="modal-overlay" onClick={() => setShowCreateServiceModal(false)}>
          <div className="modal-content create-service-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Service</h2>
              <button
                onClick={() => setShowCreateServiceModal(false)}
                className="modal-close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"></path>
                </svg>
              </button>
            </div>
            
            <div className="modal-body create-service-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Service Name</label>
                  <input
                    type="text"
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
                    className="form-input"
                    placeholder="e.g., Professional Dog Walking"
                  />
                </div>
                
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({...serviceForm, category: e.target.value})}
                    className="form-input"
                  >
                    <option value="DOG_WALKING">Dog Walking</option>
                    <option value="PET_SITTING">Pet Sitting</option>
                    <option value="PET_GROOMING">Pet Grooming</option>
                    <option value="PET_TRAINING">Pet Training</option>
                    <option value="PET_TRANSPORTATION">Pet Transportation</option>
                    <option value="PET_SUPPLY_DELIVERY">Pet Supply Delivery</option>
                    <option value="PET_BOARDING">Pet Boarding</option>
                    <option value="PET_DAYCARE">Pet Daycare</option>
                    <option value="VETERINARY_SERVICES">Veterinary Services</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Service Title</label>
                <input
                  type="text"
                  value={serviceForm.title}
                  onChange={(e) => setServiceForm({...serviceForm, title: e.target.value})}
                  className="form-input"
                  placeholder="Brief title for your service"
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                  className="form-input"
                  rows="3"
                  placeholder="Describe your service in detail..."
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({...serviceForm, price: e.target.value})}
                    className="form-input"
                    placeholder="30.00"
                  />
                </div>
                
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    value={serviceForm.durationMinutes}
                    onChange={(e) => setServiceForm({...serviceForm, durationMinutes: parseInt(e.target.value)})}
                    className="form-input"
                    placeholder="60"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={serviceForm.location}
                  onChange={(e) => setServiceForm({...serviceForm, location: e.target.value})}
                  className="form-input"
                  placeholder="Service location"
                />
              </div>
              
              <div className="form-group">
                <label>Service Type</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={serviceForm.inHomeService}
                      onChange={(e) => setServiceForm({...serviceForm, inHomeService: e.target.checked})}
                    />
                    In-home Service
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={serviceForm.outHomeService}
                      onChange={(e) => setServiceForm({...serviceForm, outHomeService: e.target.checked})}
                    />
                    Out-of-home Service
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={serviceForm.emergencyService}
                      onChange={(e) => setServiceForm({...serviceForm, emergencyService: e.target.checked})}
                    />
                    Emergency Service
                  </label>
                </div>
              </div>
              
              <div className="form-group">
                <label>Available Days</label>
                <div className="days-grid">
                  {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(day => (
                    <label key={day} className="day-label">
                      <input
                        type="checkbox"
                        checked={serviceForm.availableDays.includes(day)}
                        onChange={() => handleDayToggle(day)}
                      />
                      <span>{day.charAt(0) + day.slice(1).toLowerCase()}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Available From</label>
                  <input
                    type="time"
                    value={serviceForm.availableHoursStart}
                    onChange={(e) => setServiceForm({...serviceForm, availableHoursStart: e.target.value})}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Available Until</label>
                  <input
                    type="time"
                    value={serviceForm.availableHoursEnd}
                    onChange={(e) => setServiceForm({...serviceForm, availableHoursEnd: e.target.value})}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={handleCreateService}
                className="primary-button"
                disabled={!serviceForm.name || !serviceForm.price || !serviceForm.description}
              >
                Create Service
              </button>
              <button
                onClick={() => {
                  setShowCreateServiceModal(false);
                  resetServiceForm();
                }}
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

// Customer Dashboard Component
const CustomerDashboard = ({ services, contractors }) => (
  <>
    <section className="welcome-section">
      <h1>Find the best care for your pets!</h1>
      <p>Discover trusted pet care providers in your area</p>
    </section>
    
    <section className="dashboard-section">
      <h2>Available Services</h2>
      <div className="services-grid">
        {services.length > 0 ? (
          services.map((service) => (
            <div key={service.id} className="service-card">
              <img src="/api/placeholder/300/200" alt={service.name} />
              <div className="service-info">
                <h3>{service.name}</h3>
                <p className="service-description">{service.description}</p>
                <div className="service-meta">
                  <span className="service-price">${service.price}</span>
                  <span className="service-duration">{service.durationMinutes} min</span>
                </div>
                <div className="service-provider">
                  <small>By {service.contractorName}</small>
                </div>
                <button className="service-book-btn">Book Now</button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-data">No services available at the moment.</p>
        )}
      </div>
    </section>
    
    <section className="dashboard-section">
      <h2>Featured Contractors</h2>
      <div className="contractors-grid">
        {contractors.length > 0 ? (
          contractors.map((contractor) => (
            <div key={contractor.id} className="contractor-card">
              <img src="/api/placeholder/200/200" alt={contractor.contractorName} />
              <div className="contractor-info">
                <h3>{contractor.contractorName}</h3>
                <p className="contractor-category">{contractor.category?.replace('_', ' ')}</p>
                <div className="contractor-rating">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={`star ${i < Math.floor(contractor.averageRating || 0) ? 'filled' : ''}`}>
                      ★
                    </span>
                  ))}
                  <span className="rating-text">({contractor.reviewCount || 0} reviews)</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-data">No featured contractors available.</p>
        )}
      </div>
    </section>
  </>
);

// Contractor Dashboard Component
const ContractorDashboard = ({ services, activeTab, userProfile, onLocationUpdate, onCreateService, onDeleteService }) => {
  if (activeTab === 'overview') {
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
  }
  
  if (activeTab === 'services') {
    return (
      <>
        <section className="dashboard-section">
          <div className="section-header">
            <h1>Your Services</h1>
            <button onClick={onCreateService} className="add-service-btn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"></path>
              </svg>
              Add New Service
            </button>
          </div>
          
          <div className="services-grid">
            {services.length > 0 ? (
              services.map((service) => (
                <div key={service.id} className="service-card contractor-service">
                  <img src="/api/placeholder/300/200" alt={service.name} />
                  <div className="service-info">
                    <h3>{service.name}</h3>
                    <p className="service-description">{service.description}</p>
                    <div className="service-meta">
                      <span className="service-price">${service.price}</span>
                      <span className={`service-status status-${service.status?.toLowerCase()}`}>
                        {service.status}
                      </span>
                    </div>
                    <div className="service-stats">
                      <span>Duration: {service.durationMinutes}min</span>
                      <span>Category: {service.category?.replace('_', ' ')}</span>
                    </div>
                    <div className="service-actions">
                      <button 
                        onClick={() => console.log('Edit service:', service.id)}
                        className="service-edit-btn"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => onDeleteService(service.id)}
                        className="service-delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-services">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7.5 3.75A1.75 1.75 0 019.25 2h1.5A1.75 1.75 0 0112.5 3.75v.443c.572.055 1.138.192 1.687.404a1.75 1.75 0 01.744 2.856l-.755.755c-.42.42-1.101.42-1.521 0l-.832-.832a2.5 2.5 0 00-3.536 0l-.832.832c-.42.42-1.101.42-1.521 0l-.755-.755a1.75 1.75 0 01.744-2.856c.549-.212 1.115-.349 1.687-.404V3.75z" />
                </svg>
                <h3>No services yet</h3>
                <p>Create your first service to start accepting customers.</p>
                <button onClick={onCreateService} className="get-started-btn">Create Service</button>
              </div>
            )}
          </div>
        </section>
      </>
    );
  }
  
  if (activeTab === 'bookings') {
    return (
      <section className="dashboard-section">
        <h1>Your Bookings</h1>
        <div className="bookings-container">
          <div className="no-bookings">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <h3>No bookings yet</h3>
            <p>Bookings from customers will appear here.</p>
          </div>
        </div>
      </section>
    );
  }
  
  return null;
};

export default Dashboard;