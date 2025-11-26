package com.stori.rule.service.impl;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.stori.rule.entity.FeatureRecord;
import com.stori.rule.mapper.FeatureRecordMapper;
import com.stori.rule.service.FeatureRecordService;
import org.springframework.stereotype.Service;

@Service
public class FeatureRecordServiceImpl extends ServiceImpl<FeatureRecordMapper, FeatureRecord> implements FeatureRecordService {
    @Override
    public Page<FeatureRecord> page(Page<FeatureRecord> page, String reqId, String featureName) {
        return baseMapper.selectPageByCondition(page, reqId, featureName);
    }
}
