$body = @{
    patientId = "f5ef9487-5e91-47c3-b798-f380cbcf9f19"
    doctorId = "f19a93d7-b984-448d-9b34-841f82f8a7f4"
    consultationTypeId = "f91d3775-226a-424f-a24e-605c53d3888f"
    startDateTime = "2027-02-15T10:00:00"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8089/EverCare/appointments" -Method POST -Body $body -ContentType "application/json"