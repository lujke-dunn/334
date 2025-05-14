import React, { useState } from 'react';

const LocationModal = ({ onSubmit, onClose }) => {
  const [locationData, setLocationData] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });

  const handleSubmit = () => {
    onSubmit(locationData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
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
            onClick={handleSubmit}
            className="primary-button"
            disabled={!locationData.city || !locationData.state}
          >
            Save Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;