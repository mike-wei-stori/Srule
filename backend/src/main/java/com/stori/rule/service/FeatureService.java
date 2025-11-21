package com.stori.rule.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.stori.rule.entity.Feature;

public interface FeatureService extends IService<Feature> {
    Object execute(Long id, java.util.Map<String, Object> context);
}
