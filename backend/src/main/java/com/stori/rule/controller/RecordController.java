package com.stori.rule.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.stori.rule.common.Result;
import com.stori.rule.entity.FeatureRecord;
import com.stori.rule.entity.RuleExecutionRecord;
import com.stori.rule.service.FeatureRecordService;
import com.stori.rule.service.RuleExecutionRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/records")
public class RecordController {

    @Autowired
    private FeatureRecordService featureRecordService;

    @Autowired
    private RuleExecutionRecordService ruleExecutionRecordService;

    @GetMapping("/features")
    @PreAuthorize("hasAuthority('RECORD_READ')")
    public Result<Page<FeatureRecord>> listFeatureRecords(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String reqId,
            @RequestParam(required = false) String featureName) {
        
        Page<FeatureRecord> page = new Page<>(current, pageSize);
        return Result.success(featureRecordService.page(page, reqId, featureName));
    }

    @GetMapping("/rules")
    @PreAuthorize("hasAuthority('RECORD_READ')")
    public Result<Page<RuleExecutionRecord>> listRuleRecords(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String reqId,
            @RequestParam(required = false) String packageCode,
            @RequestParam(required = false) String status) {
        
        Page<RuleExecutionRecord> page = new Page<>(current, pageSize);
        return Result.success(ruleExecutionRecordService.page(page, reqId, packageCode, status));
    }

    @GetMapping("/rules/{id}")
    @PreAuthorize("hasAuthority('RECORD_READ')")
    public Result<RuleExecutionRecord> getRuleRecord(@PathVariable Long id) {
        return Result.success(ruleExecutionRecordService.getById(id));
    }
}
