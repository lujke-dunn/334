import React, { useState, useEffect } from 'react';

// Fixed QuickBookModal with proper z-index and styling
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
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
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
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '0',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 24px 16px',
          borderBottom: '1px solid #e5e5e5'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#111' }}>
            Book Service
          </h2>
          <button 
            onClick={onClose} 
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666'
            }}
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {/* Service Info Card */}
        <div style={{
          padding: '20px 24px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #e5e5e5'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: '#ff6b35',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '18px'
            }}>
              {getInitials(service.contractorName)}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111' }}>
                {service.name}
              </h3>
              <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                with {service.contractorName}
              </p>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                <span style={{ 
                  backgroundColor: '#ff6b35', 
                  color: 'white', 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  ${formatPrice(service.price)}
                </span>
                <span style={{ color: '#666', fontSize: '14px' }}>
                  {service.durationMinutes} min
                </span>
                <span style={{ color: '#666', fontSize: '14px' }}>
                  {service.location}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {errors.submit && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px',
            margin: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#dc2626'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <span>{errors.submit}</span>
          </div>
        )}

        {/* Booking Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="startTime" style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#111',
                fontSize: '14px'
              }}>
                When would you like this service?
              </label>
              <input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                min={getMinDate()}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `2px solid ${errors.startTime ? '#dc2626' : '#e5e5e5'}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {errors.startTime && (
                <span style={{ color: '#dc2626', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                  {errors.startTime}
                </span>
              )}
            </div>

            <div>
              <label htmlFor="notes" style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#111',
                fontSize: '14px'
              }}>
                Additional notes (optional)
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Any special instructions or requirements..."
                rows="3"
                maxLength="500"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e5e5',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
              <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                {formData.notes.length}/500
              </small>
            </div>
          </div>

          {/* Booking Summary */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600', color: '#111' }}>
              Booking Summary
            </h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#666', fontSize: '14px' }}>Start Time</span>
                <span style={{ fontWeight: '500', color: '#111', fontSize: '14px' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#666', fontSize: '14px' }}>Est. End Time</span>
                <span style={{ fontWeight: '500', color: '#111', fontSize: '14px' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#666', fontSize: '14px' }}>Duration</span>
                <span style={{ fontWeight: '500', color: '#111', fontSize: '14px' }}>
                  {service.durationMinutes} minutes
                </span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #e5e5e5', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', color: '#111', fontSize: '16px' }}>Total Price</span>
                <span style={{ 
                  fontWeight: '700', 
                  color: '#ff6b35', 
                  fontSize: '18px'
                }}>
                  ${formatPrice(service.price)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 24px',
                border: '2px solid #e5e5e5',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#666',
                fontSize: '16px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              style={{
                flex: 2,
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#ff6b35',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.8 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
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
        <div style={{
          padding: '16px 24px',
          backgroundColor: '#f8f9fa',
          borderTop: '1px solid #e5e5e5',
          borderRadius: '0 0 12px 12px'
        }}>
          <small style={{ color: '#666', fontSize: '12px', lineHeight: '1.5' }}>
            By booking this service, you agree to our terms and conditions. 
            Cancellations made less than 24 hours before the service may incur fees.
          </small>
        </div>

        {/* Add CSS for spinner animation */}
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default QuickBookModal;