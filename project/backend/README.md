# Doctor Recertification and ICU Shift Scheduling API

This API provides endpoints for managing doctor data, performance metrics, and generating optimized ICU shift schedules.

## Authentication

All API endpoints are protected with JWT-based authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Authentication Endpoints

Authentication endpoints are handled by a separate module and are not documented here.

## Data Management Endpoints

### Upload CSV Data

Upload doctor information or performance data in CSV format.

**URL**: `/api/data/upload`  
**Method**: `POST`  
**Auth required**: Yes (Admin only)  
**Content-Type**: `multipart/form-data`

**Request Body**:
- `file`: CSV file to upload
- `dataType`: Type of data (`doctors` or `performance`)

**CSV Format for Doctors**:
```
id,name,temi,amib,residence,tenure
D001,Dr. John Smith,true,false,true,5
D002,Dr. Jane Doe,false,true,false,3
```

**CSV Format for Performance**:
```
doctorId,month,year,expectedShifts,actualShifts
D001,5,2025,10,8
D002,5,2025,8,8
```

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "message": "File uploaded and processed successfully",
  "fileName": "doctors_1715184803000.csv",
  "processedRecords": 10,
  "summary": {
    "totalRecords": 10,
    "validRecords": 10,
    "errorRecords": 0
  }
}
```

**Error Response**:
- **Code**: 400 Bad Request
- **Content**:
```json
{
  "message": "Invalid data type specified"
}
```

### Get Doctors List

Retrieve the list of doctors from the most recently processed data.

**URL**: `/api/data/doctors`  
**Method**: `GET`  
**Auth required**: Yes

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "data": [
    {
      "id": "D001",
      "name": "Dr. John Smith",
      "temi": true,
      "amib": false,
      "residence": true,
      "tenure": 5
    },
    {
      "id": "D002",
      "name": "Dr. Jane Doe",
      "temi": false,
      "amib": true,
      "residence": false,
      "tenure": 3
    }
  ],
  "metadata": {
    "originalFile": "doctors_1715184803000.csv",
    "processedAt": "2025-05-08T16:40:03.000Z",
    "totalRecords": 10,
    "validRecords": 10,
    "errorRecords": 0
  }
}
```

### Get Performance Data

Retrieve performance data from the most recently processed data.

**URL**: `/api/data/performance`  
**Method**: `GET`  
**Auth required**: Yes  
**Query Parameters**:
- `doctorId` (optional): Filter results by doctor ID

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "data": [
    {
      "doctorId": "D001",
      "month": "5",
      "year": "2025",
      "expectedShifts": 10,
      "actualShifts": 8
    },
    {
      "doctorId": "D002",
      "month": "5",
      "year": "2025",
      "expectedShifts": 8,
      "actualShifts": 8
    }
  ],
  "metadata": {
    "originalFile": "performance_1715184803000.csv",
    "processedAt": "2025-05-08T16:40:03.000Z",
    "totalRecords": 10,
    "validRecords": 10,
    "errorRecords": 0
  }
}
```

### Export Data

Export doctor or performance data as CSV.

**URL**: `/api/data/export/:dataType`  
**Method**: `GET`  
**Auth required**: Yes (Admin only)  
**URL Parameters**:
- `dataType`: Type of data to export (`doctors` or `performance`)

**Success Response**:
- **Code**: 200 OK
- **Content**: CSV file download

## Schedule Management Endpoints

### Generate Schedule

Generate a new schedule using the scheduling algorithm.

**URL**: `/api/schedule/generate`  
**Method**: `POST`  
**Auth required**: Yes (Admin only)

**Request Body**:
```json
{
  "startDate": "2025-06-01T00:00:00.000Z",
  "endDate": "2025-06-30T23:59:59.999Z",
  "constraints": {
    "maxConsecutiveShifts": 3,
    "maxShiftsPerWeek": 5,
    "maxNightShiftsPerWeek": 3,
    "minRestHours": 12
  }
}
```

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "message": "Schedule generated successfully",
  "scheduleId": "schedule_1715184803000",
  "statistics": {
    "totalShifts": 60,
    "unfilledShifts": 0,
    "coverageRate": 1,
    "doctorStats": {
      "D001": {
        "name": "Dr. John Smith",
        "totalShifts": 10,
        "dayShifts": 5,
        "nightShifts": 5,
        "weekendShifts": 4
      }
    },
    "shiftTypeDistribution": {
      "day": 30,
      "night": 30,
      "weekend": 8
    }
  },
  "validation": {
    "valid": true,
    "violations": []
  },
  "unfilled": 0
}
```

### Get Schedule List

Retrieve a list of all schedules.

**URL**: `/api/schedule`  
**Method**: `GET`  
**Auth required**: Yes

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "schedules": [
    {
      "id": "schedule_1715184803000",
      "startDate": "2025-06-01T00:00:00.000Z",
      "endDate": "2025-06-30T23:59:59.999Z",
      "status": "draft",
      "createdAt": "2025-05-08T16:40:03.000Z",
      "modifiedAt": null,
      "totalShifts": 60,
      "unfilledShifts": 0
    }
  ]
}
```

### Get Schedule by ID

Retrieve a specific schedule by ID.

**URL**: `/api/schedule/:scheduleId`  
**Method**: `GET`  
**Auth required**: Yes  
**URL Parameters**:
- `scheduleId`: ID of the schedule to retrieve
**Query Parameters**:
- `doctorId` (optional): Filter assignments by doctor ID

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "id": "schedule_1715184803000",
  "startDate": "2025-06-01T00:00:00.000Z",
  "endDate": "2025-06-30T23:59:59.999Z",
  "constraints": {
    "maxConsecutiveShifts": 3,
    "maxShiftsPerWeek": 5,
    "maxNightShiftsPerWeek": 3,
    "minRestHours": 12
  },
  "schedule": {
    "assignments": [
      {
        "shiftId": "shift_1",
        "doctorId": "D001",
        "doctorName": "Dr. John Smith",
        "date": "2025-06-01T00:00:00.000Z",
        "type": "day"
      }
    ],
    "doctorAssignments": {
      "D001": [
        {
          "shiftId": "shift_1",
          "doctorId": "D001",
          "doctorName": "Dr. John Smith",
          "date": "2025-06-01T00:00:00.000Z",
          "type": "day"
        }
      ]
    },
    "shiftCounts": {
      "D001": {
        "total": 10,
        "day": 5,
        "night": 5,
        "weekend": 4
      }
    },
    "unfilled": []
  },
  "statistics": {
    "totalShifts": 60,
    "unfilledShifts": 0,
    "coverageRate": 1,
    "doctorStats": {
      "D001": {
        "name": "Dr. John Smith",
        "totalShifts": 10,
        "dayShifts": 5,
        "nightShifts": 5,
        "weekendShifts": 4
      }
    },
    "shiftTypeDistribution": {
      "day": 30,
      "night": 30,
      "weekend": 8
    }
  },
  "validation": {
    "valid": true,
    "violations": []
  },
  "status": "draft",
  "createdAt": "2025-05-08T16:40:03.000Z"
}
```

### Update Schedule

Update shift assignments in a schedule.

**URL**: `/api/schedule/:scheduleId`  
**Method**: `PUT`  
**Auth required**: Yes (Admin only)  
**URL Parameters**:
- `scheduleId`: ID of the schedule to update

**Request Body**:
```json
{
  "assignments": [
    {
      "shiftId": "shift_1",
      "doctorId": "D002"
    },
    {
      "shiftId": "shift_2",
      "doctorId": "D003"
    }
  ]
}
```

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "message": "Schedule updated successfully",
  "statistics": {
    "totalShifts": 60,
    "unfilledShifts": 0,
    "coverageRate": 1,
    "doctorStats": {
      "D001": {
        "name": "Dr. John Smith",
        "totalShifts": 8,
        "dayShifts": 4,
        "nightShifts": 4,
        "weekendShifts": 3
      },
      "D002": {
        "name": "Dr. Jane Doe",
        "totalShifts": 11,
        "dayShifts": 6,
        "nightShifts": 5,
        "weekendShifts": 4
      },
      "D003": {
        "name": "Dr. Robert Johnson",
        "totalShifts": 11,
        "dayShifts": 5,
        "nightShifts": 6,
        "weekendShifts": 4
      }
    },
    "shiftTypeDistribution": {
      "day": 30,
      "night": 30,
      "weekend": 8
    }
  },
  "validation": {
    "valid": true,
    "violations": []
  }
}
```

### Approve Schedule

Approve a draft schedule.

**URL**: `/api/schedule/:scheduleId/approve`  
**Method**: `POST`  
**Auth required**: Yes (Admin only)  
**URL Parameters**:
- `scheduleId`: ID of the schedule to approve

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "message": "Schedule approved successfully",
  "scheduleId": "schedule_1715184803000",
  "status": "approved"
}
```

### Publish Schedule

Publish an approved schedule to doctors.

**URL**: `/api/schedule/:scheduleId/publish`  
**Method**: `POST`  
**Auth required**: Yes (Admin only)  
**URL Parameters**:
- `scheduleId`: ID of the schedule to publish

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "message": "Schedule published successfully",
  "scheduleId": "schedule_1715184803000",
  "status": "published"
}
```

### Export Schedule

Export a schedule in PDF or CSV format.

**URL**: `/api/schedule/:scheduleId/export`  
**Method**: `GET`  
**Auth required**: Yes  
**URL Parameters**:
- `scheduleId`: ID of the schedule to export
**Query Parameters**:
- `format`: Export format (`pdf` or `csv`)

**Success Response**:
- **Code**: 200 OK
- **Content**: File download (PDF or CSV)

## Scheduling Algorithm

The scheduling algorithm is implemented in `backend/services/scheduler/algorithm.js` and follows these principles:

### Core Algorithm Logic

1. **Initialization**:
   - Create an empty schedule
   - Sort shifts by priority (weekend shifts first, then night shifts, then day shifts)

2. **Shift Assignment Process**:
   - For each shift:
     - Find eligible doctors based on qualifications and constraints
     - Rank eligible doctors using the prioritization rules
     - Assign the highest-ranked doctor to the shift

3. **Eligibility Criteria**:
   - Doctor must be available for the shift
   - Doctor must meet qualification requirements (TEMI, AMIB, residence status)
   - Assignment must not violate any constraints

4. **Prioritization and Tie-Breaking Rules**:
   - Doctor preferences for shifts (highest priority)
   - TEMI status (TEMI qualified doctors first)
   - Residence status (residents first)
   - Past performance balance (doctors who have done fewer shifts than expected first)
   - Tenure with UTI (more experienced doctors first)
   - Current schedule balance (doctors with fewer assigned shifts first)

5. **Constraints Handling**:
   - Maximum consecutive shifts
   - Maximum shifts per week
   - Maximum night shifts per week
   - Minimum rest hours between shifts

### Schedule Validation

The algorithm includes a validation function that checks if the generated schedule violates any constraints:

- Maximum shifts per week
- Maximum night shifts per week
- Minimum rest hours between shifts

Any violations are reported in the validation result.

## Qualification Definitions

- **TEMI**: Título de Especialista em Medicina Intensiva (Specialist Title in Intensive Care Medicine)
- **AMIB**: Associação de Medicina Intensiva Brasileira (Brazilian Intensive Care Medicine Association) certification
- **Residence**: Doctor is currently in residence program

## Error Handling

All API endpoints include comprehensive error handling:

- 400 Bad Request: Invalid input data
- 401 Unauthorized: Missing or invalid authentication
- 403 Forbidden: Insufficient permissions
- 404 Not Found: Resource not found
- 500 Internal Server Error: Server-side error

Error responses include a message and, when applicable, detailed error information.