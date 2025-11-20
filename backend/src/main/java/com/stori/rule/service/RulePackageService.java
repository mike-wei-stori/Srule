package com.stori.rule.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.stori.rule.entity.RulePackage;

import java.util.Map;

public interface RulePackageService extends IService<RulePackage> {
    void publish(Long id);
    void offline(Long id);
    Map<String, Object> test(Long id, Map<String, Object> inputs);
}
