package com.stori.rule.service.impl;

import com.alibaba.fastjson.JSON;
import com.stori.rule.entity.FeatureRecord;
import com.stori.rule.entity.RuleExecutionRecord;
import com.stori.rule.mapper.FeatureRecordMapper;
import com.stori.rule.mapper.RuleExecutionRecordMapper;
import com.stori.rule.service.AsyncRecordService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
public class AsyncRecordServiceImpl implements AsyncRecordService {

    @Autowired
    private FeatureRecordMapper featureRecordMapper;

    @Autowired
    private RuleExecutionRecordMapper ruleExecutionRecordMapper;

    @Override
    @Async
    public void recordFeature(String reqId, Long featureId, String featureName, Object value, long executionTime) {
        try {
            FeatureRecord record = new FeatureRecord();
            record.setReqId(reqId);
            record.setFeatureId(featureId);
            record.setFeatureName(featureName);
            record.setFeatureValue(JSON.toJSONString(value));
            record.setExecutionTimeMs(executionTime);
            featureRecordMapper.insert(record);
        } catch (Exception e) {
            log.error("Failed to record feature execution", e);
        }
    }

    @Override
    @Async
    public void recordRuleExecution(String reqId, String packageCode, Map<String, Object> input, Map<String, Object> output, long executionTime, String status, String errorMsg) {
        try {
            RuleExecutionRecord record = new RuleExecutionRecord();
            record.setReqId(reqId);
            record.setPackageCode(packageCode);
            record.setInputParams(JSON.toJSONString(input));
            record.setOutputResult(JSON.toJSONString(output));
            record.setExecutionTimeMs(executionTime);
            record.setStatus(status);
            record.setErrorMessage(errorMsg);
            ruleExecutionRecordMapper.insert(record);
        } catch (Exception e) {
            log.error("Failed to record rule execution", e);
        }
    }
}
