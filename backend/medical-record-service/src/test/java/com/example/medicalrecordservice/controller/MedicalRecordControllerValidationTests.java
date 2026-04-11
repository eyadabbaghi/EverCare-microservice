package com.example.medicalrecordservice.controller;

import com.example.medicalrecordservice.exception.GlobalExceptionHandler;
import com.example.medicalrecordservice.service.MedicalRecordService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MedicalRecordController.class)
@Import(GlobalExceptionHandler.class)
class MedicalRecordControllerValidationTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MedicalRecordService medicalRecordService;

    @Test
    void createShouldRejectMissingPatientId() throws Exception {
        mockMvc.perform(post("/api/medical-records")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "bloodGroup": "A+",
                                  "alzheimerStage": "MILD"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.validationErrors.patientId").value("patientId is required"));
    }

    @Test
    void updateShouldRejectInvalidAlzheimerStage() throws Exception {
        mockMvc.perform(put("/api/medical-records/record-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "bloodGroup": "O+",
                                  "alzheimerStage": "UNKNOWN"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.validationErrors.alzheimerStage")
                        .value("alzheimerStage must be one of MILD, MODERATE, SEVERE"));
    }
}
