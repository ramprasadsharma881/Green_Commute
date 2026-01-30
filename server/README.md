# 🌱 Eco Commute Collective - Backend API

Complete REST API for the ride-sharing platform with real-time features, authentication, and database persistence.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# 1. Navigate to server directory
cd server

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Edit .env with your configuration
# Set JWT_SECRET, PORT, etc.

# 5. Initialize database
npm run init-db

# 6. Start server
npm run dev  # Development with auto-reload
# OR
npm start    # Production
```

## 📡 API Endpoints

### Base URL: `http://localhost:3001/api`

### Authentication

```http
POST /auth/register
POST /auth/login
```

### Rides

```http
GET    /rides              - List all rides (with filters)
GET    /rides/:id          - Get ride details
POST   /rides              - Create ride (auth required)
PUT    /rides/:id          - Update ride (auth required)
DELETE /rides/:id          - Delete ride (auth required)
GET    /rides/driver/:id   - Get driver's rides
POST   /rides/search       - Search rides
POST   /rides/:id/location - Update live location
GET    /rides/:id/location - Get live location
```

### Users

```http
GET /users/:id  - Get user profile
GET /users/me   - Get current user (auth required)
```

### Bookings

```http
POST /bookings           - Create booking (auth required)
GET  /bookings/my-bookings - My bookings (auth required)
```

## 🔒 Authentication

Protected endpoints require JWT token:

```http
Authorization: Bearer <your-jwt-token>
```

## 📚 Example Requests

### Register User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "+1234567890",
    "role": "both"
  }'
```

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Create Ride

```bash
curl -X POST http://localhost:3001/api/rides \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "Downtown Station",
    "destination": "Tech Park Area",
    "dateTime": "2025-11-05T10:00:00Z",
    "availableSeats": 3,
    "pricePerSeat": 12,
    "vehicleModel": "Toyota Prius",
    "vehicleColor": "Silver",
    "distance": 15.3,
    "duration": 23,
    "co2Saved": 2.8,
    "waypoints": [
      { "location": "Main Street", "order": 1 }
    ],
    "preferences": {
      "hasAC": true,
      "musicAllowed": true,
      "instantBooking": true
    }
  }'
```

### Search Rides

```bash
curl -X POST http://localhost:3001/api/rides/search \
  -H "Content-Type: application/json" \
  -d '{
    "source": "Downtown",
    "destination": "Tech Park",
    "seats": 2
  }'
```

## 🗄️ Database

**Type:** SQLite  
**Location:** `./data/eco-commute.db`

### Schema

- **users** - User accounts and profiles
- **rides** - Ride listings
- **waypoints** - Intermediate stops
- **ride_preferences** - Ride settings
- **bookings** - Passenger bookings
- **reviews** - Ratings and feedback
- **live_locations** - Real-time GPS data

## 🔧 Environment Variables

```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:8080
DATABASE_PATH=./data/eco-commute.db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

## 📦 Scripts

```bash
npm start      # Start server
npm run dev    # Start with nodemon
npm run init-db # Initialize database
```

## 🛡️ Security Features

- JWT authentication
- Password hashing (bcrypt)
- Input validation
- SQL injection prevention
- CORS configuration
- Helmet.js security headers
- Rate limiting ready

## 📊 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "errors": [ ... ]
}
```

## 🔄 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## 🧪 Testing

```bash
# Health check
curl http://localhost:3001/api/health

# Should return:
{
  "status": "healthy",
  "timestamp": "2025-11-05T...",
  "environment": "development"
}
```

## 📝 Logs

Server uses Morgan for request logging in development mode.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Submit pull request

## 📄 License

MIT

## 🆘 Support

For issues or questions:
- Check documentation
- Review error logs
- Contact team

---

**Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** November 5, 2025
