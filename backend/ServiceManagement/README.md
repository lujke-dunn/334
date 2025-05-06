# Service Management API Documentation

## Overview

The Service Management API provides endpoints for managing service listings in the pet services application. This API allows contractors to create, update, and manage their service offerings, while customers can search and browse available services.

## Base URL

All API requests should be prefixed with: `http://localhost:8082/api`

## Authentication

All requests must include contractor identification headers for operations that modify data:

```
X-Contractor-ID: 123
X-Contractor-Name: Contractor Name
X-Contractor-Email: email@example.com
```

## Service Endpoints

### List All Services

Returns all active service listings.

- **URL**: `/services`
- **Method**: `GET`
- **Auth Required**: No
- **Response Format**: JSON array of service objects

**Example Response:**
```json
[
  {
    "id": 4,
    "name": "Curl Test Service",
    "title": "Service Created Via Curl",
    "description": "Updated description for testing curl commands",
    "price": 34.99,
    "durationMinutes": 60,
    "category": "DOG_WALKING",
    "contractorID": 123,
    "contractorName": "Test Contractor",
    "contractorEmail": "contractor@example.com",
    "location": "Curl Test Location",
    "inHomeService": true,
    "outHomeService": false,
    "emergencyService": false,
    "availableDays": ["WEDNESDAY", "MONDAY", "FRIDAY"],
    "availableHoursStart": "09:00",
    "availableHoursEnd": "17:00",
    "status": "ACTIVE",
    "averageRating": 0.0,
    "reviewCount": 0,
    "completedBookings": 0,
    "featured": false,
    "createdAt": "2025-05-06T18:39:40.867",
    "updatedAt": "2025-05-06T18:39:41.173"
  }
]
```

### Get Service by ID

Retrieves details for a specific service.

- **URL**: `/services/{id}`
- **Method**: `GET`
- **URL Params**: `id=[Long]` - ID of the service to retrieve
- **Auth Required**: No
- **Response Format**: JSON service object

**Example Request:**
```
GET /services/4
```

**Example Response:**
```json
{
  "id": 4,
  "name": "Curl Test Service",
  "title": "Service Created Via Curl",
  "description": "Updated description for testing curl commands",
  "price": 34.99,
  "durationMinutes": 60,
  "category": "DOG_WALKING",
  "contractorID": 123,
  "contractorName": "Test Contractor",
  "contractorEmail": "contractor@example.com",
  "location": "Curl Test Location",
  "inHomeService": true,
  "outHomeService": false,
  "emergencyService": false,
  "availableDays": ["WEDNESDAY", "MONDAY", "FRIDAY"],
  "availableHoursStart": "09:00",
  "availableHoursEnd": "17:00",
  "status": "ACTIVE",
  "averageRating": 0.0,
  "reviewCount": 0,
  "completedBookings": 0,
  "featured": false,
  "createdAt": "2025-05-06T18:39:40.867",
  "updatedAt": "2025-05-06T18:39:41.173"
}
```

### Create Service

Creates a new service listing.

- **URL**: `/services`
- **Method**: `POST`
- **Headers**:
    - `Content-Type: application/json`
    - `X-Contractor-ID: [ID]`
    - `X-Contractor-Name: [Name]`
    - `X-Contractor-Email: [Email]`
- **Body**: JSON object with service details
- **Response Format**: JSON service object with assigned ID
- **Response Code**: 201 (Created)

**Example Request:**
```json
{
  "name": "Curl Test Service",
  "title": "Service Created Via Curl",
  "description": "This service was created using curl to test the API",
  "price": 29.99,
  "durationMinutes": 60,
  "category": "DOG_WALKING",
  "location": "Curl Test Location",
  "inHomeService": true,
  "outHomeService": false,
  "emergencyService": false,
  "availableDays": ["MONDAY", "WEDNESDAY", "FRIDAY"],
  "availableHoursStart": "09:00",
  "availableHoursEnd": "17:00"
}
```

**Example Response:**
```json
{
  "id": 4,
  "name": "Curl Test Service",
  "title": "Service Created Via Curl",
  "description": "This service was created using curl to test the API",
  "price": 29.99,
  "durationMinutes": 60,
  "category": "DOG_WALKING",
  "contractorID": 123,
  "contractorName": "Test Contractor",
  "contractorEmail": "contractor@example.com",
  "location": "Curl Test Location",
  "inHomeService": true,
  "outHomeService": false,
  "emergencyService": false,
  "availableDays": ["MONDAY", "WEDNESDAY", "FRIDAY"],
  "availableHoursStart": "09:00",
  "availableHoursEnd": "17:00",
  "status": "PENDING",
  "averageRating": 0.0,
  "reviewCount": 0,
  "completedBookings": 0,
  "featured": false,
  "createdAt": "2025-05-06T18:39:40.867",
  "updatedAt": "2025-05-06T18:39:40.867"
}
```

### Update Service

Updates an existing service listing.

- **URL**: `/services/{id}`
- **Method**: `PUT`
- **URL Params**: `id=[Long]` - ID of the service to update
- **Headers**:
    - `Content-Type: application/json`
    - `X-Contractor-ID: [ID]`
    - `X-Contractor-Name: [Name]`
    - `X-Contractor-Email: [Email]`
- **Body**: JSON object with fields to update (partial updates supported)
- **Response Format**: JSON service object with updated fields
- **Response Code**: 200 (OK)

**Example Request:**
```json
{
  "price": 34.99,
  "description": "Updated description for testing curl commands"
}
```

**Example Response:**
```json
{
  "id": 4,
  "name": "Curl Test Service",
  "title": "Service Created Via Curl",
  "description": "Updated description for testing curl commands",
  "price": 34.99,
  "durationMinutes": 60,
  "category": "DOG_WALKING",
  "contractorID": 123,
  "contractorName": "Test Contractor",
  "contractorEmail": "contractor@example.com",
  "location": "Curl Test Location",
  "inHomeService": true,
  "outHomeService": false,
  "emergencyService": false,
  "availableDays": ["MONDAY", "WEDNESDAY", "FRIDAY"],
  "availableHoursStart": "09:00",
  "availableHoursEnd": "17:00",
  "status": "PENDING",
  "averageRating": 0.0,
  "reviewCount": 0,
  "completedBookings": 0,
  "featured": false,
  "createdAt": "2025-05-06T18:39:40.867",
  "updatedAt": "2025-05-06T18:39:41.015"
}
```

### Approve Service

Changes a service status from PENDING to ACTIVE.

- **URL**: `/services/{id}/approve`
- **Method**: `PUT`
- **URL Params**: `id=[Long]` - ID of the service to approve
- **Response Format**: JSON service object with updated status
- **Response Code**: 200 (OK)

**Example Request:**
```
PUT /services/4/approve
```

**Example Response:**
```json
{
  "id": 4,
  "name": "Curl Test Service",
  "title": "Service Created Via Curl",
  "description": "Updated description for testing curl commands",
  "price": 34.99,
  "durationMinutes": 60,
  "category": "DOG_WALKING",
  "contractorID": 123,
  "contractorName": "Test Contractor",
  "contractorEmail": "contractor@example.com",
  "location": "Curl Test Location",
  "inHomeService": true,
  "outHomeService": false,
  "emergencyService": false,
  "availableDays": ["MONDAY", "WEDNESDAY", "FRIDAY"],
  "availableHoursStart": "09:00",
  "availableHoursEnd": "17:00",
  "status": "ACTIVE",
  "averageRating": 0.0,
  "reviewCount": 0,
  "completedBookings": 0,
  "featured": false,
  "createdAt": "2025-05-06T18:39:40.867",
  "updatedAt": "2025-05-06T18:39:41.173"
}
```

### Delete Service

Deletes a service listing (soft delete - changes status to DELETED).

- **URL**: `/services/{id}`
- **Method**: `DELETE`
- **URL Params**: `id=[Long]` - ID of the service to delete
- **Headers**:
    - `X-Contractor-ID: [ID]` - Must match the service's contractor ID
- **Response Code**: 204 (No Content)

**Example Request:**
```
DELETE /services/4
X-Contractor-ID: 123
```

## Search and Filter Endpoints

### Search Services

Searches for services based on search terms.

- **URL**: `/services/search`
- **Method**: `GET`
- **Query Params**:
    - `searchTerm=[string]` - Text to search in service titles and descriptions
    - `page=[int]` - Page number (default: 0)
    - `pageSize=[int]` - Results per page (default: 10)
    - `sortBy=[string]` - Field to sort by (default: "createdAt")
    - `sortOrder=[string]` - Sort direction ("asc" or "desc", default: "desc")
- **Response Format**: JSON array of service objects

**Example Request:**
```
GET /services/search?searchTerm=Curl
```

**Example Response:**
```json
[
  {
    "id": 4,
    "name": "Curl Test Service",
    "title": "Service Created Via Curl",
    "description": "Updated description for testing curl commands",
    "price": 34.99,
    "durationMinutes": 60,
    "category": "DOG_WALKING",
    "contractorID": 123,
    "contractorName": "Test Contractor",
    "contractorEmail": "contractor@example.com",
    "location": "Curl Test Location",
    "inHomeService": true,
    "outHomeService": false,
    "emergencyService": false,
    "availableDays": ["MONDAY", "WEDNESDAY", "FRIDAY"],
    "availableHoursStart": "09:00",
    "availableHoursEnd": "17:00",
    "status": "ACTIVE",
    "averageRating": 0.0,
    "reviewCount": 0,
    "completedBookings": 0,
    "featured": false,
    "createdAt": "2025-05-06T18:39:40.867",
    "updatedAt": "2025-05-06T18:39:41.173"
  }
]
```

### Get Services by Category

Returns services in a specific category.

- **URL**: `/services/category/{category}`
- **Method**: `GET`
- **URL Params**: `category=[string]` - Service category (e.g., DOG_WALKING, PET_SITTING)
- **Response Format**: JSON array of service objects

**Example Request:**
```
GET /services/category/DOG_WALKING
```

**Example Response:**
```json
[
  {
    "id": 4,
    "name": "Curl Test Service",
    "title": "Service Created Via Curl",
    "description": "Updated description for testing curl commands",
    "price": 34.99,
    "durationMinutes": 60,
    "category": "DOG_WALKING",
    "contractorID": 123,
    "contractorName": "Test Contractor",
    "contractorEmail": "contractor@example.com",
    "location": "Curl Test Location",
    "inHomeService": true,
    "outHomeService": false,
    "emergencyService": false,
    "availableDays": ["MONDAY", "WEDNESDAY", "FRIDAY"],
    "availableHoursStart": "09:00",
    "availableHoursEnd": "17:00",
    "status": "ACTIVE",
    "averageRating": 0.0,
    "reviewCount": 0,
    "completedBookings": 0,
    "featured": false,
    "createdAt": "2025-05-06T18:39:40.867",
    "updatedAt": "2025-05-06T18:39:41.173"
  }
]
```

### Get Featured Services

Returns featured service listings.

- **URL**: `/services/featured`
- **Method**: `GET`
- **Response Format**: JSON array of featured service objects

**Example Request:**
```
GET /services/featured
```

**Example Response:**
```json
[]
```

### Get Top Rated Services

Returns top-rated service listings.

- **URL**: `/services/top-rated`
- **Method**: `GET`
- **Query Params**:
    - `limit=[int]` - Maximum number of services to return (default: 10)
    - `minReviews=[int]` - Minimum number of reviews required (default: 5)
- **Response Format**: JSON array of top-rated service objects

**Example Request:**
```
GET /services/top-rated?limit=3&minReviews=2
```

### Get Contractor Services

Returns services offered by a specific contractor.

- **URL**: `/services/contractor/{contractorId}`
- **Method**: `GET`
- **URL Params**: `contractorId=[Long]` - ID of the contractor
- **Response Format**: JSON array of service objects

**Example Request:**
```
GET /services/contractor/123
```

**Example Response:**
```json
[
  {
    "id": 4,
    "name": "Curl Test Service",
    "title": "Service Created Via Curl",
    "description": "Updated description for testing curl commands",
    "price": 34.99,
    "durationMinutes": 60,
    "category": "DOG_WALKING",
    "contractorID": 123,
    "contractorName": "Test Contractor",
    "contractorEmail": "contractor@example.com",
    "location": "Curl Test Location",
    "inHomeService": true,
    "outHomeService": false,
    "emergencyService": false,
    "availableDays": ["MONDAY", "WEDNESDAY", "FRIDAY"],
    "availableHoursStart": "09:00",
    "availableHoursEnd": "17:00",
    "status": "ACTIVE",
    "averageRating": 0.0,
    "reviewCount": 0,
    "completedBookings": 0,
    "featured": false,
    "createdAt": "2025-05-06T18:39:40.867",
    "updatedAt": "2025-05-06T18:39:41.173"
  }
]
```

## Advanced Search

More complex search with multiple parameters:

- **URL**: `/services/search`
- **Method**: `GET`
- **Query Params**:
    - `location=[string]` - Filter by location
    - `minPrice=[decimal]` - Minimum price
    - `maxPrice=[decimal]` - Maximum price
    - `availableDay=[string]` - Filter by available day (e.g., MONDAY)
    - `radius=[int]` - Search radius in kilometers (requires latitude/longitude)
    - `latitude=[double]` - Latitude for geo search
    - `longitude=[double]` - Longitude for geo search
    - `featuredOnly=[boolean]` - Show only featured services
    - `minRating=[int]` - Minimum average rating
- **Response Format**: JSON array of service objects

**Example Request:**
```
GET /services/search?location=Test%20Location&minPrice=20.00&maxPrice=50.00
```

## Error Responses

All endpoints can return the following error responses:

- **400 Bad Request**: Invalid input parameters
- **404 Not Found**: Resource not found
- **403 Forbidden**: Contractor ID does not match the resource owner
- **500 Internal Server Error**: Server error

## Model Reference

### Service Listing Object

```json
{
  "id": 4,
  "name": "Curl Test Service",
  "title": "Service Created Via Curl",
  "description": "Updated description for testing curl commands",
  "price": 34.99,
  "durationMinutes": 60,
  "category": "DOG_WALKING",
  "contractorID": 123,
  "contractorName": "Test Contractor",
  "contractorEmail": "contractor@example.com",
  "location": "Curl Test Location",
  "latitude": null,
  "longitude": null,
  "serviceRadius": null,
  "inHomeService": true,
  "outHomeService": false,
  "emergencyService": false,
  "availableDays": ["MONDAY", "WEDNESDAY", "FRIDAY"],
  "availableHoursStart": "09:00",
  "availableHoursEnd": "17:00",
  "status": "ACTIVE",
  "averageRating": 0.0,
  "reviewCount": 0,
  "completedBookings": 0,
  "featured": false,
  "createdAt": "2025-05-06T18:39:40.867",
  "updatedAt": "2025-05-06T18:39:41.173"
}
```

### Service Categories

Valid service categories:
- DOG_WALKING
- PET_SITTING
- PET_GROOMING
- PET_TRAINING
- PET_TRANSPORTATION
- PET_SUPPLY_DELIVERY
- PET_BOARDING
- PET_DAYCARE
- VETERINARY_SERVICES
- OTHER

### Service Status

Possible service statuses:
- PENDING (new services awaiting approval)
- ACTIVE (approved and visible in search)
- INACTIVE (temporarily hidden)
- SUSPENDED (administratively disabled)
- DELETED (soft-deleted)