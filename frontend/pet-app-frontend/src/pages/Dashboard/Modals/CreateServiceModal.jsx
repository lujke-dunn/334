import React, { useState } from 'react';

const CreateServiceModal = ({ userProfile, onSubmit, onClose }) => {
  const [serviceForm, setServiceForm] = useState({
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

  const handleSubmit = () => {
    const serviceData = {
      ...serviceForm,
      price: parseFloat(serviceForm.price),
      status: 'ACTIVE' // Make service active immediately
    };
    onSubmit(serviceData);
    resetForm();
  };

  const resetForm = () => {
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

  return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content create-service-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Create New Service</h2>
            <button
                onClick={onClose}
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
                <div className="checkbox-item">
                  <input
                      type="checkbox"
                      id="inHomeService"
                      checked={serviceForm.inHomeService}
                      onChange={(e) => setServiceForm({...serviceForm, inHomeService: e.target.checked})}
                  />
                  <label htmlFor="inHomeService">In-home Service</label>
                </div>
                <div className="checkbox-item">
                  <input
                      type="checkbox"
                      id="outHomeService"
                      checked={serviceForm.outHomeService}
                      onChange={(e) => setServiceForm({...serviceForm, outHomeService: e.target.checked})}
                  />
                  <label htmlFor="outHomeService">Out-of-home Service</label>
                </div>
                <div className="checkbox-item">
                  <input
                      type="checkbox"
                      id="emergencyService"
                      checked={serviceForm.emergencyService}
                      onChange={(e) => setServiceForm({...serviceForm, emergencyService: e.target.checked})}
                  />
                  <label htmlFor="emergencyService">Emergency Service</label>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Available Days</label>
              <div className="days-grid">
                {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(day => (
                    <div key={day} className="day-item">
                      <input
                          type="checkbox"
                          id={`day-${day}`}
                          checked={serviceForm.availableDays.includes(day)}
                          onChange={() => handleDayToggle(day)}
                      />
                      <label htmlFor={`day-${day}`}>
                        {day.charAt(0) + day.slice(1).toLowerCase()}
                      </label>
                    </div>
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
                onClick={handleSubmit}
                className="primary-button"
                disabled={!serviceForm.name || !serviceForm.price || !serviceForm.description}
            >
              Create Service
            </button>
            <button
                onClick={() => {
                  onClose();
                  resetForm();
                }}
                className="secondary-button"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
  );
};

export default CreateServiceModal;