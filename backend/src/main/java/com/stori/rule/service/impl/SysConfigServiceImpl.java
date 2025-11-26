package com.stori.rule.service.impl;

import com.stori.rule.entity.SysConfig;
import com.stori.rule.mapper.SysConfigMapper;
import com.stori.rule.service.SysConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SysConfigServiceImpl implements SysConfigService {

    @Autowired
    private SysConfigMapper sysConfigMapper;

    @Override
    public String getValue(String key) {
        SysConfig config = sysConfigMapper.selectByKey(key);
        return config != null ? config.getConfigValue() : null;
    }

    @Override
    public String getValue(String key, String defaultValue) {
        String value = getValue(key);
        return value != null ? value : defaultValue;
    }

    @Override
    public void setValue(String key, String value, String description) {
        SysConfig config = sysConfigMapper.selectByKey(key);
        if (config == null) {
            config = new SysConfig();
            config.setConfigKey(key);
            config.setConfigValue(value);
            config.setDescription(description);
            sysConfigMapper.insert(config);
        } else {
            config.setConfigValue(value);
            if (description != null) {
                config.setDescription(description);
            }
            sysConfigMapper.updateById(config);
        }
    }

    @Override
    public List<SysConfig> getAllConfigs() {
        return sysConfigMapper.selectList(null);
    }

    @Override
    public void deleteConfig(String key) {
        sysConfigMapper.deleteByKey(key);
    }
}
