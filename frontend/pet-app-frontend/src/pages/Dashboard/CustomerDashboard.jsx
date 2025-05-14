import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../Toast';
import QuickBookModal from './Modals/QuickBookModal';

// Search component that replaces the hero section
const HeroSearchSection = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('Sydney, Australia');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  
  const searchRef = useRef(null);
  const locationRef = useRef(null);

  // Sydney-specific locations
  const sydneyLocations = [
    'Sydney, Australia',
    'Sydney CBD',
    'Bondi Beach',
    'Manly',
    'Surry Hills',
    'Newtown',
    'Paddington',
    'Double Bay',
    'Balmain',
    'Leichhardt',
    'North Sydney',
    'Chatswood',
    'Parramatta',
    'Bankstown',
    'Liverpool',
    'Penrith',
    'Northern Beaches',
    'Inner West',
    'Eastern Suburbs',
    'Western Sydney'
  ];

  // Filter options
  const filterOptions = [
    { id: 'in-home', label: 'In-Home Service', icon: '🏠' },
    { id: 'emergency', label: 'Emergency Available', icon: '🚨' },
    { id: 'featured', label: 'Featured Services', icon: '⭐' },
    { id: 'highest-rated', label: 'Highest Rated', icon: '🏆' },
    { id: 'lowest-price', label: 'Lowest Price', icon: '💰' },
    { id: 'nearby', label: 'Near Sydney CBD', icon: '📍' },
  ];

  // Handle clicks outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle location input changes
  const handleLocationChange = (value) => {
    setLocation(value);
    if (value.length > 0) {
      let suggestions = sydneyLocations.filter(loc =>
        loc.toLowerCase().includes(value.toLowerCase())
      );
      
      if (value.toLowerCase().includes('syd')) {
        suggestions = sydneyLocations;
      }
      
      setLocationSuggestions(suggestions.slice(0, 8));
      setShowLocationDropdown(true);
    } else {
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    const searchData = {
      term: searchTerm,
      location: location,
      filters: activeFilters,
      city: 'Sydney',
      country: 'Australia'
    };
    onSearch(searchData);
  };

  // Handle filter selection
  const handleFilterSelect = (filter) => {
    const isActive = activeFilters.some(f => f.id === filter.id);
    
    let newFilters;
    if (isActive) {
      newFilters = activeFilters.filter(f => f.id !== filter.id);
    } else {
      newFilters = [...activeFilters, filter];
    }
    
    setActiveFilters(newFilters);
    setShowFilterDropdown(false);
    
    const searchData = {
      term: searchTerm,
      location: location,
      filters: newFilters,
      city: 'Sydney',
      country: 'Australia'
    };
    onSearch(searchData);
  };

  // Remove filter
  const removeFilter = (filterId) => {
    const newFilters = activeFilters.filter(f => f.id !== filterId);
    setActiveFilters(newFilters);
    
    const searchData = {
      term: searchTerm,
      location: location,
      filters: newFilters,
      city: 'Sydney',
      country: 'Australia'
    };
    onSearch(searchData);
  };

  // Handle location suggestion click
  const handleLocationSelect = (suggestion) => {
    setLocation(suggestion);
    setShowLocationDropdown(false);
    setLocationSuggestions([]);
    
    const searchData = {
      term: searchTerm,
      location: suggestion,
      filters: activeFilters,
      city: 'Sydney',
      country: 'Australia'
    };
    onSearch(searchData);
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className="hero-search-section">
      <div className="hero-content">
        <h1>Find Pet Care Services</h1>
      </div>
      
      <div className="search-container" ref={searchRef}>
        <div className="search-wrapper">
          <div className="search-inputs">
            <input
              type="text"
              className="service-search"
              placeholder="What pet service do you need?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setShowFilterDropdown(true)}
            />
            
            <div className="location-input-wrapper" ref={locationRef}>
              <input
                type="text"
                className="location-search"
                placeholder="Where in Sydney?"
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => {
                  if (location.length > 0) setShowLocationDropdown(true);
                }}
              />
              
              {showLocationDropdown && locationSuggestions.length > 0 && (
                <div className="location-suggestions">
                  {locationSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="location-suggestion"
                      onClick={() => handleLocationSelect(suggestion)}
                    >
                      <span className="location-icon">📍</span>
                      <span>{suggestion}</span>
                      {suggestion.includes('CBD') && <span className="location-badge">Popular</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <button 
              className="uber-search-btn"
              onClick={handleSearch}
              title="Search pet services"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="M21 21l-4.35-4.35"></path>
              </svg>
            </button>
          </div>
          
          {showFilterDropdown && (
            <div className="filter-dropdown">
              {filterOptions.map((filter) => (
                <div
                  key={filter.id}
                  className="filter-option"
                  onClick={() => handleFilterSelect(filter)}
                >
                  <span>{filter.icon}</span>
                  <span>{filter.label}</span>
                  {activeFilters.some(f => f.id === filter.id) && (
                    <svg style={{ marginLeft: 'auto' }} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {activeFilters.length > 0 && (
          <div className="active-filters">
            {activeFilters.map((filter) => (
              <div key={filter.id} className="filter-tag">
                <span>{filter.icon}</span>
                <span>{filter.label}</span>
                <span 
                  className="remove-tag"
                  onClick={() => removeFilter(filter.id)}
                >
                  ×
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};


// Main Customer Dashboard Component
const CustomerDashboard = ({ services, contractors }) => {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [searchResults, setSearchResults] = useState(services);
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    setSearchResults(services);
    loadRecentBookings();
  }, [services]);

  const loadRecentBookings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('No token available');
        return;
      }

      const response = await fetch('http://localhost:8083/api/bookings/customer?page=0&size=5', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentBookings(data.content || []);
      } else {
        console.log('Failed to load recent bookings:', response.status);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const handleSearch = async (searchData) => {
    try {
      // Build search URL with parameters
      let url = 'http://localhost:8082/api/services/search?';
      const params = new URLSearchParams();
      
      if (searchData.term) {
        params.append('searchTerm', searchData.term);
      }
      if (searchData.location && searchData.location !== 'Sydney, Australia') {
        params.append('location', searchData.location);
      }
      
      // Apply filters
      if (searchData.filters) {
        searchData.filters.forEach(filter => {
          switch (filter.id) {
            case 'featured':
              params.append('featuredOnly', 'true');
              break;
            case 'lowest-price':
              params.append('sortBy', 'price');
              params.append('sortOrder', 'asc');
              break;
            case 'highest-rated':
              params.append('sortBy', 'averageRating');
              params.append('sortOrder', 'desc');
              break;
            // Add other filter mappings as needed
          }
        });
      }
      
      url += params.toString();
      console.log('Search URL:', url);
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      } else {
        console.error('Search failed:', response.status);
        showToast('Search failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error searching services:', error);
      showToast('An error occurred while searching. Please try again.', 'error');
    }
  };

  const handleBookService = (service) => {
    console.log('Selected service for booking:', service); // Debug log
    
    // Ensure we have all required fields before opening modal
    if (!service.id) {
      showToast('Service ID is missing. Please try refreshing the page.', 'error');
      return;
    }
    
    // Normalize the contractor ID field name
    const normalizedService = {
      ...service,
      contractorId: service.contractorID || service.contractorId,
      contractorID: service.contractorID || service.contractorId
    };
    
    if (!normalizedService.contractorId) {
      showToast('Contractor information is missing for this service.', 'error');
      return;
    }
    
    console.log('Normalized service:', normalizedService); // Debug log
    setSelectedService(normalizedService);
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (bookingData) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('You must be logged in to make a booking');
      }

      console.log('Submitting booking:', bookingData); // Debug log

      const response = await fetch('http://localhost:8083/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      console.log('Booking response status:', response.status); // Debug log

      if (response.ok) {
        const booking = await response.json();
        console.log('Booking created successfully:', booking); // Debug log
        showToast('Booking submitted successfully! You\'ll receive confirmation from the contractor soon.', 'success');
        setShowBookingModal(false);
        setSelectedService(null);
        loadRecentBookings(); // Refresh recent bookings
      } else {
        // Handle different error responses
        let errorMessage = 'Failed to create booking';
        try {
          const errorData = await response.json();
          console.log('Error response:', errorData); // Debug log
          
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.fields) {
            // Handle validation errors
            const fieldErrors = Object.values(errorData.fields).join(', ');
            errorMessage = `Validation error: ${fieldErrors}`;
          }
        } catch (e) {
          const errorText = await response.text();
          console.log('Error text:', errorText); // Debug log
          errorMessage = `Server error: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      throw error; // Re-throw to be handled by the modal
    }
  };

  return (
    <div className="streamlined-dashboard">
      {/* Toast Container */}
      <ToastContainer />

      {/* Hero Search Section */}
      <HeroSearchSection onSearch={handleSearch} />

      {/* Recent Bookings - Compact View */}
      {recentBookings.length > 0 && (
        <section className="recent-bookings">
          <h3>Your Recent Bookings</h3>
          <div className="bookings-list">
            {recentBookings.slice(0, 3).map(booking => (
              <div key={booking.id} className="booking-item">
                <div className="booking-info">
                  <span className="service-name">{booking.serviceName}</span>
                  <span className="booking-date">{new Date(booking.startTime).toLocaleDateString()}</span>
                </div>
                <span className={`status ${booking.status.toLowerCase()}`}>
                  {booking.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Services Grid - Enhanced Design */}
      <section className="services-section">
        <h3>Available Services</h3>
        <div className="services-grid">
          {searchResults && searchResults.length > 0 ? (
            searchResults.map(service => (
              <div 
                key={service.id} 
                className="service-card"
                data-category={service.category?.toLowerCase().replace('_', '-')}
              >
                {service.featured && <div className="featured-badge">Featured</div>}
                
                <div className="service-icon"></div>
                
                <div className="service-info">
                  <h4>{service.name}</h4>
                  <p>with {service.contractorName}</p>
                  
                  {service.averageRating && service.averageRating > 0 && (
                    <div className="service-rating">
                      <div className="stars">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`star ${i < Math.floor(service.averageRating) ? 'filled' : 'empty'}`}>
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="rating-count">({service.reviewCount || 0})</span>
                    </div>
                  )}
                  
                  <div className="service-meta">
                    <span className="price">${service.price}</span>
                    <span className="duration">{service.durationMinutes}min</span>
                  </div>
                </div>
                
                <button 
                  className="book-btn"
                  onClick={() => handleBookService(service)}
                  disabled={!service.id}
                >
                  Book Now
                </button>
              </div>
            ))
          ) : (
            <div className="no-services">
              <p>No services found. Try adjusting your search filters.</p>
            </div>
          )}
        </div>
      </section>

      {/* Quick Book Modal */}
      {showBookingModal && selectedService && (
        <QuickBookModal
          service={selectedService}
          onSubmit={handleBookingSubmit}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedService(null);
          }}
          userEmail={localStorage.getItem('userEmail')}
        />
      )}
    </div>
  );
};

export default CustomerDashboard;