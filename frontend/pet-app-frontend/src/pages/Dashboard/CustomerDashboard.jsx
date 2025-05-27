import React, { useState, useEffect } from 'react';
import { useToast } from '../Toast';
import QuickBookModal from './Modals/QuickBookModal';

// Random rating generator
const generateRandomRating = () => {
  // Generate ratings between 3.5 and 5 stars (to keep them positive)
  const ratings = [3.5, 4, 4, 4.5, 4.5, 4.5, 5, 5, 5];
  const rating = ratings[Math.floor(Math.random() * ratings.length)];
  // Generate review count between 5 and 150
  const reviewCount = Math.floor(Math.random() * 145) + 5;
  return { rating, reviewCount };
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

                        <div className="service-rating">
                          {(() => {
                            const { rating, reviewCount } = generateRandomRating();
                            return (
                              <>
                                <div className="stars">
                                  {[...Array(5)].map((_, i) => (
                                    <span 
                                      key={i} 
                                      className={`star ${i < Math.floor(rating) ? 'filled' : (i === Math.floor(rating) && rating % 1 !== 0 ? 'half' : 'empty')}`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <span className="rating-value">{rating.toFixed(1)}</span>
                                <span className="rating-count">({reviewCount} reviews)</span>
                              </>
                            );
                          })()}
                        </div>

                        <div className="service-meta">
                          <span className="price">{service.price}</span>
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

        <style jsx>{`
        .streamlined-dashboard {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* Recent Bookings */
        .recent-bookings {
          margin-bottom: 40px;
        }

        .recent-bookings h3 {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 16px;
        }

        .bookings-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .booking-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .booking-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .service-name {
          font-weight: 600;
          color: #1f2937;
        }

        .booking-date {
          font-size: 14px;
          color: #6b7280;
        }

        .status {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status.pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status.confirmed {
          background: #d1fae5;
          color: #065f46;
        }

        .status.completed {
          background: #dbeafe;
          color: #1e40af;
        }

        .status.cancelled {
          background: #fee2e2;
          color: #991b1b;
        }

        /* Services Section */
        .services-section h3 {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 24px;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        .service-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          position: relative;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .service-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          border-color: #d1d5db;
        }

        .featured-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #f59e0b;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .service-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 50%;
          margin-bottom: 16px;
        }

        .service-info h4 {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .service-info p {
          color: #6b7280;
          margin: 0 0 16px 0;
          font-size: 14px;
        }

        .service-rating {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .stars {
          display: flex;
          gap: 2px;
        }

        .star {
          font-size: 14px;
        }

        .star.filled {
          color: #fbbf24;
        }

        .star.empty {
          color: #e5e7eb;
        }

        .rating-count {
          font-size: 12px;
          color: #6b7280;
        }

        .service-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .price {
          font-weight: 700;
          color: #059669;
          font-size: 18px;
        }

        .duration {
          color: #6b7280;
        }

        .rating-value {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
          margin-left: 4px;
        }

        .star.half {
          position: relative;
          color: #e5e7eb;
        }

        .star.half::before {
          content: '★';
          position: absolute;
          left: 0;
          top: 0;
          width: 50%;
          overflow: hidden;
          color: #fbbf24;
        }

        .book-btn {
          width: 100%;
          padding: 12px;
          background: #ff7a00;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .book-btn:hover {
          background: #e56e00;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 122, 0, 0.3);
        }

        .book-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .no-services {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .streamlined-dashboard {
            padding: 16px;
          }

          .services-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .booking-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }
      `}</style>
      </div>
  );
};

export default CustomerDashboard;