package com.example.medicalrecordservice.validation;

public final class MedicalRecordValidationRules {

    public static final String BLOOD_GROUP_PATTERN = "(?i)^(A|B|AB|O)[+-]$";
    public static final String BLOOD_GROUP_MESSAGE = "bloodGroup must be one of A+, A-, B+, B-, AB+, AB-, O+, O-";

    public static final String ALZHEIMER_STAGE_PATTERN = "(?i)^(MILD|MODERATE|SEVERE)$";
    public static final String ALZHEIMER_STAGE_MESSAGE = "alzheimerStage must be one of MILD, MODERATE, SEVERE";

    private MedicalRecordValidationRules() {
    }
}
