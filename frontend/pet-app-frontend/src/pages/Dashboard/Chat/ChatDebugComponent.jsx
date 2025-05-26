import React, { useState, useEffect } from 'react';
import {
  getCurrentUserId,
  getUserRole,
  fetchBookings,
  fetchContractorBookings,
  checkAllServicesHealth,
  debugAuthState
} from '../../../utils/api';

const ChatDebugComponent = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    const info = {};

    try {
      // 1. Check auth state
      info.authState = debugAuthState();

      // 2. Check services
      info.servicesHealth = await checkAllServicesHealth();

      // 3. Try to fetch bookings
      const userRole = getUserRole();
      try {
        if (userRole === 'CUSTOMER') {
          info.bookings = await fetchBookings(0, 10);
        } else {
          info.bookings = await fetchContractorBookings(0, 10);
        }
        info.bookingsError = null;
      } catch (err) {
        info.bookingsError = err.message;
        info.bookings = null;
      }

      // 4. Extract actual bookings array
      if (info.bookings) {
        info.bookingsArray = info.bookings.content || info.bookings;
        info.bookingsCount = info.bookingsArray?.length || 0;

        // Filter for confirmed bookings
        info.confirmedBookings = info.bookingsArray?.filter(b =>
          ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(b.status)
        ) || [];
        info.confirmedCount = info.confirmedBookings.length;
      }

      setDebugInfo(info);
    } catch (error) {
      console.error('Debug failed:', error);
      info.error = error.message;
      setDebugInfo(info);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Running diagnostics...</div>;
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '20px auto',
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <h2 style={{ marginBottom: '20px', fontFamily: 'Arial' }}>🔍 Chat System Diagnostics</h2>

      <button
        onClick={runDiagnostics}
        style={{
          marginBottom: '20px',
          padding: '8px 16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        🔄 Re-run Diagnostics
      </button>

      {/* Auth State */}
      <div style={{ marginBottom: '20px' }}>
        <h3>👤 Authentication</h3>
        <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
          <div><strong>User ID:</strong> {debugInfo.authState?.userId}</div>
          <div><strong>User Role:</strong> {debugInfo.authState?.userRole}</div>
          <div><strong>Authenticated:</strong> {debugInfo.authState?.isAuthenticated ? '✅' : '❌'}</div>
          <div><strong>Access Token:</strong> {debugInfo.authState?.accessToken ? '✅ Present' : '❌ Missing'}</div>
        </div>
      </div>

      {/* Services Health */}
      <div style={{ marginBottom: '20px' }}>
        <h3>🏥 Services Health</h3>
        <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
          {debugInfo.servicesHealth?.map(service => (
            <div key={service.name} style={{ marginBottom: '4px' }}>
              <strong>{service.name}:</strong> {service.healthy ? '✅ UP' : '❌ DOWN'}
              {service.error && ` (${service.error})`}
            </div>
          ))}
        </div>
      </div>

      {/* Bookings */}
      <div style={{ marginBottom: '20px' }}>
        <h3>📋 Bookings</h3>
        <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
          {debugInfo.bookingsError ? (
            <div style={{ color: 'red' }}>
              <strong>❌ Error:</strong> {debugInfo.bookingsError}
            </div>
          ) : (
            <>
              <div><strong>Total Bookings:</strong> {debugInfo.bookingsCount || 0}</div>
              <div><strong>Confirmed Bookings:</strong> {debugInfo.confirmedCount || 0}</div>

              {debugInfo.confirmedBookings && debugInfo.confirmedBookings.length > 0 && (
                <details style={{ marginTop: '10px' }}>
                  <summary style={{ cursor: 'pointer' }}>📋 Confirmed Bookings Details</summary>
                  <div style={{ marginTop: '8px', maxHeight: '200px', overflow: 'auto' }}>
                    {debugInfo.confirmedBookings.map(booking => (
                      <div key={booking.id} style={{
                        margin: '4px 0',
                        padding: '4px',
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '2px'
                      }}>
                        <div><strong>ID:</strong> {booking.id}</div>
                        <div><strong>Status:</strong> {booking.status}</div>
                        <div><strong>Service:</strong> {booking.service?.title || 'Unknown'}</div>
                        <div><strong>Customer ID:</strong> {booking.customerId}</div>
                        <div><strong>Contractor ID:</strong> {booking.contractorId}</div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div style={{ marginBottom: '20px' }}>
        <h3>💡 Recommendations</h3>
        <div style={{ backgroundColor: '#fff3cd', padding: '10px', borderRadius: '4px' }}>
          {debugInfo.servicesHealth?.some(s => !s.healthy) && (
            <div style={{ marginBottom: '8px' }}>
              ⚠️ <strong>Some services are down.</strong> Start them with:
              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                {debugInfo.servicesHealth.filter(s => !s.healthy).map(service => (
                  <li key={service.name}>
                    cd backend/{service.name.replace(' ', '')} && ./mvnw spring-boot:run
                  </li>
                ))}
              </ul>
            </div>
          )}

          {debugInfo.bookingsError && (
            <div style={{ marginBottom: '8px' }}>
              ❌ <strong>Cannot load bookings.</strong> Make sure BookingService is running on port 8083.
            </div>
          )}

          {debugInfo.confirmedCount === 0 && !debugInfo.bookingsError && (
            <div style={{ marginBottom: '8px' }}>
              📝 <strong>No confirmed bookings found.</strong> Create some test bookings with CONFIRMED status to enable chat.
            </div>
          )}

          {!debugInfo.authState?.isAuthenticated && (
            <div style={{ marginBottom: '8px' }}>
              🔑 <strong>User not authenticated.</strong> Make sure to log in first.
            </div>
          )}
        </div>
      </div>

      {/* Raw Data */}
      <details>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>🔍 Raw Debug Data</summary>
        <pre style={{
          backgroundColor: '#f8f9fa',
          padding: '10px',
          borderRadius: '4px',
          overflow: 'auto',
          maxHeight: '300px',
          marginTop: '10px'
        }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default ChatDebugComponent;