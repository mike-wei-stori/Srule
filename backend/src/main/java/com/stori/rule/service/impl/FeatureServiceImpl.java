package com.stori.rule.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.stori.rule.entity.Feature;
import com.stori.rule.mapper.FeatureMapper;
import com.stori.rule.service.FeatureService;
import org.springframework.stereotype.Service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import org.springframework.util.StringUtils;

@Service
public class FeatureServiceImpl extends ServiceImpl<FeatureMapper, Feature> implements FeatureService {

    @Override
    public boolean save(Feature entity) {
        validate(entity);
        return super.save(entity);
    }

    @Override
    public boolean updateById(Feature entity) {
        validate(entity);
        return super.updateById(entity);
    }

    private void validate(Feature feature) {
        if (StringUtils.isEmpty(feature.getType())) {
            throw new IllegalArgumentException("Feature type is required");
        }
        if (StringUtils.isEmpty(feature.getConfig())) {
            throw new IllegalArgumentException("Feature config is required");
        }

        try {
            JSONObject config = JSON.parseObject(feature.getConfig());
            switch (feature.getType()) {
                case "SQL":
                    if (!config.containsKey("sql")) {
                        throw new IllegalArgumentException("SQL feature requires 'sql' in config");
                    }
                    break;
                case "RPC":
                    if (!config.containsKey("interfaceName") || !config.containsKey("method")) {
                        throw new IllegalArgumentException("RPC feature requires 'interfaceName' and 'method' in config");
                    }
                    break;
                case "CONSTANT":
                    if (!config.containsKey("value")) {
                        throw new IllegalArgumentException("Constant feature requires 'value' in config");
                    }
                    break;
                default:
                    // Allow other types or throw error?
                    break;
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid config JSON: " + e.getMessage());
        }
    }
    @org.springframework.beans.factory.annotation.Autowired
    private com.stori.rule.executor.FeatureExecutorFactory featureExecutorFactory;

    @Override
    public Object execute(Long id, java.util.Map<String, Object> context) {
        Feature feature = getById(id);
        if (feature == null) {
            throw new IllegalArgumentException("Feature not found");
        }
        com.stori.rule.executor.FeatureExecutor executor = featureExecutorFactory.getExecutor(feature.getType());
        if (executor == null) {
            throw new IllegalArgumentException("No executor found for type: " + feature.getType());
        }
        return executor.execute(feature, context);
    }
}
