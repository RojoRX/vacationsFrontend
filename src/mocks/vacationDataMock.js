export  const vacationDataMock = {
    "name": null,
    "email": "testuser",
    "position": null,
    "fechaIngreso": "2012-08-01T00:00:00.000Z",
    "antiguedadEnAnios": 12,
    "antiguedadEnMeses": 155,
    "antiguedadEnDias": 4746,
    "diasDeVacacion": 30,
    "diasDeVacacionRestantes": -2.5,
    "recesos": [
      {
        "name": "INVIERNO",
        "startDate": "2023-06-01T00:00:00.000Z",
        "endDate": "2023-06-15T23:59:59.000Z",
        "totalDays": 11,
        "nonHolidayDays": 0,
        "daysCount": 11,
        "type": "general"
      },
      {
        "name": "FINDEGESTION",
        "startDate": "2023-12-20T00:00:00.000Z",
        "endDate": "2024-01-05T23:59:59.000Z",
        "totalDays": 13,
        "nonHolidayDays": 2,
        "daysCount": 11,
        "type": "general"
      }
    ],
    "diasNoHabiles": 2,
    "nonHolidayDaysDetails": [
      {
        "date": "2023-12-25",
        "reason": "Dentro del receso general FINDEGESTION"
      },
      {
        "date": "2023-12-20",
        "reason": "Dentro del receso general FINDEGESTION"
      }
    ],
    "licenciasAutorizadas": {
      "totalAuthorizedDays": 5.5,
      "requests": [
        {
          "id": 32,
          "licenseType": "VACACION",
          "timeRequested": "Varios Días",
          "startDate": "2024-09-10",
          "endDate": "2024-09-14",
          "issuedDate": "2024-09-04T05:15:13.551Z",
          "immediateSupervisorApproval": true,
          "personalDepartmentApproval": true,
          "userId": 1,
          "totalDays": "5"
        },
        {
          "id": 33,
          "licenseType": "VACACION",
          "timeRequested": "Medio Día",
          "startDate": "2024-09-01",
          "endDate": "2024-09-01",
          "issuedDate": "2024-09-04T05:16:25.949Z",
          "immediateSupervisorApproval": true,
          "personalDepartmentApproval": true,
          "userId": 1,
          "totalDays": "0.5"
        }
      ]
    },
    "solicitudesDeVacacionAutorizadas": {
      "totalAuthorizedVacationDays": 5,
      "requests": [
        {
          "id": 14,
          "position": "Developer",
          "requestDate": "2024-09-10",
          "startDate": "2024-09-06",
          "endDate": "2024-09-07",
          "totalDays": 1,
          "status": "AUTHORIZED",
          "postponedDate": null,
          "postponedReason": null,
          "returnDate": "2024-09-09",
          "approvedByHR": false,
          "approvedBySupervisor": false
        },
        {
          "id": 16,
          "position": "Developer",
          "requestDate": "2024-09-10",
          "startDate": "2024-08-15",
          "endDate": "2024-08-20",
          "totalDays": 4,
          "status": "AUTHORIZED",
          "postponedDate": null,
          "postponedReason": null,
          "returnDate": "2024-08-19",
          "approvedByHR": false,
          "approvedBySupervisor": false
        }
      ]
    }
  };
  
  // Asegúrate de exportar mockUserData si es necesario

  