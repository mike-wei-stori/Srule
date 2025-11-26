package com.stori.rule.service.impl;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.stori.rule.entity.RuleExecutionRecord;
import com.stori.rule.mapper.RuleExecutionRecordMapper;
import com.stori.rule.service.RuleExecutionRecordService;
import org.springframework.stereotype.Service;

@Service
public class RuleExecutionRecordServiceImpl extends ServiceImpl<RuleExecutionRecordMapper, RuleExecutionRecord> implements RuleExecutionRecordService {
    @Override
    public Page<RuleExecutionRecord> page(Page<RuleExecutionRecord> page, String reqId, String packageCode, String status) {
        return baseMapper.selectPageByCondition(page, reqId, packageCode, status);
    }
}
