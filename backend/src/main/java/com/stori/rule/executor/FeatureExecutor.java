package com.stori.rule.executor;

import com.stori.rule.entity.Feature;
import java.util.Map;

public interface FeatureExecutor {
    /**
     * Execute feature extraction
     * @param feature The feature definition
     * @param context Context variables (e.g., userId)
     * @return The extracted value
     */
    Object execute(Feature feature, Map<String, Object> context);
    
    String getType();
}
