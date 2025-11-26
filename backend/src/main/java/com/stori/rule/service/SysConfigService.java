package com.stori.rule.service;

import com.stori.rule.entity.SysConfig;
import java.util.List;

public interface SysConfigService {
    String getValue(String key);
    String getValue(String key, String defaultValue);
    void setValue(String key, String value, String description);
    List<SysConfig> getAllConfigs();
    void deleteConfig(String key);
}

