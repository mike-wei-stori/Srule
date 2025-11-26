package com.stori.rule.service;

import java.util.Map;

public interface AsyncRecordService {
    /**
     * Record feature execution asynchronously
     * @param reqId Request ID
     * @param featureId Feature ID
     * @param featureName Feature Name
     * @param value Feature Value
     * @param executionTime Execution Time in ms
     */
    void recordFeature(String reqId, Long featureId, String featureName, Object value, long executionTime);

    /**
     * Record rule execution asynchronously
     * @param reqId Request ID
     * @param packageCode Package Code
     * @param input Input Parameters
     * @param output Output Result
     * @param executionTime Execution Time in ms
     * @param status Status (SUCCESS/FAIL)
     * @param errorMsg Error Message
     */
    void recordRuleExecution(String reqId, String packageCode, Map<String, Object> input, Map<String, Object> output, long executionTime, String status, String errorMsg);
}
