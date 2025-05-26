import React, { useState, useEffect } from 'react';
import { getAccessToken } from '../../../utils/api';
import '../../../styles/ContractorOverview.css'

const ContractorOverview = ({ services, userProfile, onLocationUpdate }) => {
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingStats, setBookingStats] = useState({
    activeCustomers: 0,
    totalEarnings: 0,
    completedJobs: 0
  });

  useEffect(() => {
    loadRecentActivity();
  }, [userProfile.id]);

  const loadRecentActivity = async () => {
    try {
      if (!userProfile.id) return;

      const token = getAccessToken();

      // Load recent bookings with status changes
      const bookingsResponse = await fetch(`http://localhost:8083/api/bookings/contractor`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        const bookings = bookingsData.content || bookingsData;

        // Calculate stats from bookings
        const stats = {
          activeCustomers: bookings.filter(b => b.status === 'CONFIRMED').length,
          totalEarnings: bookings
              .filter(b => b.status === 'COMPLETED')
              .reduce((sum, b) => sum + (b.price || 0), 0),
          completedJobs: bookings.filter(b => b.status === 'COMPLETED').length
        };
        setBookingStats(stats);

        // Transform bookings into activity items
        const activities = [];

        // Sort bookings by most recent update
        const sortedBookings = bookings.sort((a, b) =>
            new Date(b.updatedAt) - new Date(a.updatedAt)
        );

        // Add different types of activities based on booking status and timing
        sortedBookings.slice(0, 10).forEach(booking => {
          // If booking was recently created
          if (booking.status === 'PENDING') {
            activities.push({
              id: `booking-${booking.id}-created`,
              type: 'booking-request',
              title: 'New booking request',
              description: `${booking.customerName} requested ${booking.serviceName}`,
              timestamp: booking.createdAt,
              icon: 'bell',
              color: 'orange',
              booking: booking
            });
          }

          // If booking was recently confirmed
          else if (booking.status === 'CONFIRMED') {
            activities.push({
              id: `booking-${booking.id}-confirmed`,
              type: 'booking-confirmed',
              title: 'Booking confirmed',
              description: `You accepted ${booking.serviceName} with ${booking.customerName}`,
              timestamp: booking.updatedAt,
              icon: 'check',
              color: 'green',
              booking: booking
            });
          }

          // If booking was recently completed
          else if (booking.status === 'COMPLETED') {
            activities.push({
              id: `booking-${booking.id}-completed`,
              type: 'booking-completed',
              title: 'Service completed',
              description: `Completed ${booking.serviceName} for ${booking.customerName}`,
              timestamp: booking.updatedAt,
              icon: 'trophy',
              color: 'blue',
              booking: booking,
              showRating: booking.customerRating
            });
          }

          // If booking was cancelled
          else if (booking.status === 'CANCELLED') {
            activities.push({
              id: `booking-${booking.id}-cancelled`,
              type: 'booking-cancelled',
              title: 'Booking cancelled',
              description: `${booking.serviceName} with ${booking.customerName} was cancelled`,
              timestamp: booking.updatedAt,
              icon: 'x',
              color: 'red',
              booking: booking
            });
          }
        });

        // Add service-related activities
        if (services && services.length > 0) {
          const recentServices = services
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 3);

          recentServices.forEach(service => {
            activities.push({
              id: `service-${service.id}-created`,
              type: 'service-created',
              title: 'New service created',
              description: `Created ${service.name} service`,
              timestamp: service.createdAt,
              icon: 'plus',
              color: 'purple',
              service: service
            });
          });
        }

        // Sort all activities by timestamp
        const sortedActivities = activities
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 8); // Show last 8 activities

        setRecentActivity(sortedActivities);
      }
    } catch (error) {
      console.error('Error loading recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconType) => {
    const icons = {
      bell: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
      ),
      check: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
      ),
      trophy: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
          </svg>
      ),
      x: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
      ),
      plus: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
      )
    };
    return icons[iconType] || icons.bell;
  };

  const getColorClass = (color) => {
    const classes = {
      orange: 'bg-orange-100 text-orange-600',
      green: 'bg-green-100 text-green-600',
      blue: 'bg-blue-100 text-blue-600',
      red: 'bg-red-100 text-red-600',
      purple: 'bg-purple-100 text-purple-600'
    };
    return classes[color] || 'bg-gray-100 text-gray-600';
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
      <>
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
                <p className="stat-number">{services?.length || 0}</p>
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
                <p className="stat-number">{bookingStats.activeCustomers}</p>
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
                <p className="stat-number">${bookingStats.totalEarnings.toFixed(2)}</p>
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
                <p className="stat-number">{bookingStats.completedJobs}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Recent Activity</h2>
            <button onClick={loadRecentActivity} className="refresh-btn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Refresh
            </button>
          </div>

          <div className="activity-list">
            {loading ? (
                <div className="activity-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading recent activity...</p>
                </div>
            ) : recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                    <div key={activity.id} className="activity-item" data-type={activity.type}>
                      <div className={`activity-icon ${getColorClass(activity.color)}`}>
                        {getIcon(activity.icon)}
                      </div>
                      <div className="activity-content">
                        <h4>{activity.title}</h4>
                        <p>{activity.description}</p>
                        {activity.showRating && (
                            <div className="activity-rating">
                      <span className="stars">
                        {Array.from({ length: 5 }, (_, i) => (
                            <span
                                key={i}
                                className={i < activity.showRating ? 'star filled' : 'star'}
                            >
                            ★
                          </span>
                        ))}
                      </span>
                              <span>Customer rated {activity.showRating}/5</span>
                            </div>
                        )}
                        <div className="activity-meta">
                          <span className="activity-time">{formatTimeAgo(activity.timestamp)}</span>
                          {activity.booking && (
                              <span className="activity-amount">${activity.booking.price}</span>
                          )}
                        </div>
                      </div>
                    </div>
                ))
            ) : (
                <div className="activity-item empty">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M2.5 3A1.5 1.5 0 014 1.5h12A1.5 1.5 0 0117.5 3v11.5A1.5 1.5 0 0116 16H4a1.5 1.5 0 01-1.5-1.5V3zm2 1.5a.5.5 0 000 1h11a.5.5 0 000-1h-11zm0 2.5a.5.5 0 000 1h11a.5.5 0 000-1h-11zm0 2.5a.5.5 0 000 1h11a.5.5 0 000-1h-11z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3>No recent activity</h3>
                    <p>Start by creating your first service!</p>
                  </div>
                </div>
            )}
          </div>
        </section>
      </>
  );
};

export default ContractorOverview;