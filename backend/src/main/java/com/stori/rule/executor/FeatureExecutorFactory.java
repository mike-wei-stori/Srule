package com.stori.rule.executor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class FeatureExecutorFactory {

    private final Map<String, FeatureExecutor> executorMap = new HashMap<>();

    @Autowired
    public FeatureExecutorFactory(List<FeatureExecutor> executors) {
        for (FeatureExecutor executor : executors) {
            executorMap.put(executor.getType(), executor);
        }
    }

    public FeatureExecutor getExecutor(String type) {
        return executorMap.get(type);
    }
}
