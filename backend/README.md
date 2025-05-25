# Doctor Scheduling Backend

Backend API for doctor recertification and ICU shift scheduling application.

## Overview

This backend provides a RESTful API for managing doctor recertification, preference collection, and ICU shift scheduling with optimization for 24/7 coverage, specific qualification rules, and maximizing doctor satisfaction.

## Project Structure

```
./backend/
├── config/             # Configuration files
├── controllers/        # Request handlers
├── middleware/         # Express middleware
├── models/             # Database models
├── routes/             # API routes
├── services/           # Business logic
│   └── scheduler/      # Scheduling algorithm
├── utils/              # Helper functions
├── app.js              # Express application setup
├── server.js           # Server entry point
└── package.json        # Project dependencies
```

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   cd backend
   npm install
   ```
3. Create a `.env` file based on `.env.template`:
   ```
   cp .env.template .env
   ```
4. Update the `.env` file with your database credentials and other configuration options
5. Start the server:
   ```
   npm start
   ```
   
   For development with auto-reload:
   ```
   npm run dev
   ```

## Database

The application uses PostgreSQL with Sequelize ORM. The database schema is defined in `models/database_schema.sql` and is automatically initialized when the server starts.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh-token` - Refresh authentication token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `POST /api/doctors` - Create doctor
- `PUT /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor
- `GET /api/doctors/:id/qualifications` - Get doctor qualifications
- `PUT /api/doctors/:id/qualifications` - Update doctor qualifications
- `GET /api/doctors/:id/availability` - Get doctor availability
- `PUT /api/doctors/:id/availability` - Update doctor availability
- `POST /api/doctors/:id/time-off` - Request time off
- `GET /api/doctors/:id/time-off` - Get time off requests

### Admin
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/qualifications` - Get qualifications
- `POST /api/admin/qualifications` - Create qualification
- `PUT /api/admin/qualifications/:id` - Update qualification
- `DELETE /api/admin/qualifications/:id` - Delete qualification
- `GET /api/admin/shift-types` - Get shift types
- `POST /api/admin/shift-types` - Create shift type
- `PUT /api/admin/shift-types/:id` - Update shift type
- `DELETE /api/admin/shift-types/:id` - Delete shift type
- `GET /api/admin/groups` - Get groups
- `POST /api/admin/groups` - Create group
- `PUT /api/admin/groups/:id` - Update group
- `DELETE /api/admin/groups/:id` - Delete group
- `GET /api/admin/time-off-requests` - Get time off requests
- `PUT /api/admin/time-off-requests/:id/approve` - Approve time off request
- `PUT /api/admin/time-off-requests/:id/reject` - Reject time off request
- `POST /api/admin/import` - Import doctor data

### Schedules
- `POST /api/schedules/generate` - Generate schedule
- `GET /api/schedules` - Get schedule
- `PUT /api/schedules/assignments/:id` - Update shift assignment
- `GET /api/schedules/shifts` - Get shifts
- `POST /api/schedules/shifts` - Create shift
- `PUT /api/schedules/shifts/:id` - Update shift
- `DELETE /api/schedules/shifts/:id` - Delete shift
- `GET /api/schedules/shifts/:id/requirements` - Get shift requirements
- `PUT /api/schedules/shifts/:id/requirements` - Update shift requirements

### Preferences
- `GET /api/preferences/doctors/:id` - Get doctor preferences
- `PUT /api/preferences/doctors/:id` - Update doctor preferences
- `GET /api/preferences/shift-types/:id` - Get shift type preferences
- `PUT /api/preferences/shift-types/:id` - Update shift type preferences
- `GET /api/preferences/settings` - Get preference settings
- `PUT /api/preferences/settings` - Update preference settings

### Reports
- `GET /api/reports/schedule` - Get schedule report
- `GET /api/reports/workload` - Get doctor workload report
- `GET /api/reports/qualification-coverage` - Get qualification coverage report
- `GET /api/reports/preference-satisfaction` - Get preference satisfaction report
- `GET /api/reports/export/schedule/pdf` - Export schedule to PDF
- `GET /api/reports/export/schedule/csv` - Export schedule to CSV
- `GET /api/reports/export/doctors/csv` - Export doctor data to CSV

## Testing

Run tests with:
```
npm test
```

## License

This project is proprietary and confidential.