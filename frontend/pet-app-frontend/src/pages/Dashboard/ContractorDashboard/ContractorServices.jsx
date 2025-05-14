import React from 'react';

const ContractorServices = ({ services, onCreateService, onDeleteService }) => {
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
};

export default ContractorServices;