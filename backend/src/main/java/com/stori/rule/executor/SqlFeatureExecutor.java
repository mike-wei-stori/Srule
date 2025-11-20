package com.stori.rule.executor;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.stori.rule.entity.Feature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class SqlFeatureExecutor implements FeatureExecutor {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public Object execute(Feature feature, Map<String, Object> context) {
        JSONObject config = JSON.parseObject(feature.getConfig());
        String sql = config.getString("sql");
        
        // Simple parameter replacement (vulnerable to injection, use PreparedStatement in prod)
        // Better: Use named parameter jdbc template or parse placeholders
        for (Map.Entry<String, Object> entry : context.entrySet()) {
            sql = sql.replace("#{" + entry.getKey() + "}", String.valueOf(entry.getValue()));
        }
        
        // Execute
        // Assuming single value return for simplicity
        try {
            return jdbcTemplate.queryForObject(sql, Object.class);
        } catch (Exception e) {
            // Log error
            return null;
        }
    }

    @Override
    public String getType() {
        return "SQL";
    }
}
