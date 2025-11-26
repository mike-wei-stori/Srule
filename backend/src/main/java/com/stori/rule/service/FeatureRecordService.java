package com.stori.rule.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.stori.rule.entity.FeatureRecord;

public interface FeatureRecordService extends IService<FeatureRecord> {
    Page<FeatureRecord> page(Page<FeatureRecord> page, String reqId, String featureName);
}
