package com.stori.rule.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.stori.rule.entity.RuleExecutionRecord;

public interface RuleExecutionRecordService extends IService<RuleExecutionRecord> {
    Page<RuleExecutionRecord> page(Page<RuleExecutionRecord> page, String reqId, String packageCode, String status);
}
