import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../Toast';

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

// Improved QuickBookModal with better UI/UX
const QuickBookModal = ({ service, onSubmit, onClose, userEmail }) => {
  const [formData, setFormData] = useState({
    startTime: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Debug log when modal opens
  useEffect(() => {
    console.log('QuickBookModal opened with service:', service);
  }, [service]);

  // Auto-calculate end time based on service duration
  const getEndTime = (startTime) => {
    if (!startTime || !service.durationMinutes) return null;
    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.durationMinutes * 60000);
    return end.toISOString().replace('T', ' ').slice(0, 19);
  };

  // Get minimum date (next hour)
  const getMinDate = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.startTime) {
      newErrors.startTime = 'Please select a date and time';
    } else {
      // Check if the selected time is at least 1 hour in the future
      const selectedTime = new Date(formData.startTime);
      const minTime = new Date();
      minTime.setHours(minTime.getHours() + 1);
      
      if (selectedTime < minTime) {
        newErrors.startTime = 'Please select a time at least 1 hour in the future';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    
    // Use the correct field name from the service object
    const contractorId = service.contractorID || service.contractorId;
    
    // Ensure we have a contractor ID
    if (!contractorId) {
      setErrors({ submit: 'Service contractor information is missing. Please try another service.' });
      setLoading(false);
      return;
    }
    
    // Format the datetime string correctly
    const startDateTime = formData.startTime + ':00';
    const endDateTime = getEndTime(formData.startTime);
    
    console.log('Service object in modal:', service); // Debug log
    console.log('Contractor ID:', contractorId); // Debug log
    
    const bookingData = {
      serviceId: service.id,
      contractorId: contractorId,
      startTime: startDateTime,
      endTime: endDateTime,
      location: service.location || 'Sydney, Australia',
      price: service.price,
      notes: formData.notes || ''
    };

    console.log('Booking data being sent:', bookingData); // Debug log

    try {
      await onSubmit(bookingData);
    } catch (error) {
      console.error('Booking error:', error);
      // More detailed error handling
      if (error.message) {
        setErrors({ submit: error.message });
      } else if (error.fields) {
        setErrors(error.fields);
      } else {
        setErrors({ submit: 'Failed to create booking. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate initials for avatar
  const getInitials = (name) => {
    if (!name) return 'C';
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format currency
  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return price.toFixed(2);
    }
    return price;
  };

  return (
    <div className="quick-book-overlay" onClick={onClose}>
      <div className="quick-book-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="quick-book-header">
          <h2>Book Service</h2>
          <button onClick={onClose} className="close-button" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {/* Service Info Card */}
        <div className="service-info-card">
          <div className="service-card-content">
            <div className="contractor-avatar">
              {getInitials(service.contractorName)}
            </div>
            <div className="service-details">
              <h3>{service.name}</h3>
              <p className="contractor-name">with {service.contractorName}</p>
              <div className="service-meta">
                <span className="price">${formatPrice(service.price)}</span>
                <span className="duration">{service.durationMinutes} min</span>
                <span className="location">{service.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {errors.submit && (
          <div className="error-banner">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <span>{errors.submit}</span>
          </div>
        )}

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="startTime">When would you like this service?</label>
              <input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                min={getMinDate()}
                className={`date-input ${errors.startTime ? 'error' : ''}`}
                required
              />
              {errors.startTime && <span className="error-text">{errors.startTime}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="notes">Additional notes (optional)</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Any special instructions or requirements..."
                rows="3"
                className="notes-input"
                maxLength="500"
              />
              <small className="char-count">{formData.notes.length}/500</small>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="booking-summary">
            <h4>Booking Summary</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">Start Time</span>
                <span className="value">
                  {formData.startTime ? 
                    new Date(formData.startTime).toLocaleString('en-AU', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      timeZone: 'Australia/Sydney'
                    }) : 
                    'Not selected'
                  }
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Est. End Time</span>
                <span className="value">
                  {formData.startTime ? 
                    new Date(getEndTime(formData.startTime)).toLocaleString('en-AU', {
                      hour: 'numeric',
                      minute: '2-digit',
                      timeZone: 'Australia/Sydney'
                    }) : 
                    'Auto-calculated'
                  }
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Duration</span>
                <span className="value">{service.durationMinutes} minutes</span>
              </div>
              <div className="summary-item total">
                <span className="label">Total Price</span>
                <span className="value price">${formatPrice(service.price)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button type="button" onClick={onClose} className="cancel-button" disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="confirm-button">
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Creating Booking...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                  Confirm Booking
                </>
              )}
            </button>
          </div>
        </form>

        {/* Terms Notice */}
        <div className="terms-notice">
          <small>
            By booking this service, you agree to our terms and conditions. 
            Cancellations made less than 24 hours before the service may incur fees.
          </small>
        </div>
      </div>
    </div>
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