package com.stori.rule.executor;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.stori.rule.entity.Feature;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class RpcFeatureExecutor implements FeatureExecutor {

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public Object execute(Feature feature, Map<String, Object> context) {
        JSONObject config = JSON.parseObject(feature.getConfig());
        String url = config.getString("url");
        String method = config.getString("method"); // GET, POST
        
        // Replace placeholders in URL
        for (Map.Entry<String, Object> entry : context.entrySet()) {
            url = url.replace("{" + entry.getKey() + "}", String.valueOf(entry.getValue()));
        }

        HttpHeaders headers = new HttpHeaders();
        // Add headers if configured
        if (config.containsKey("headers")) {
            JSONObject headerConfig = config.getJSONObject("headers");
            for (String key : headerConfig.keySet()) {
                headers.add(key, headerConfig.getString(key));
            }
        }

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(context, headers);

        try {
            ResponseEntity<Object> response = restTemplate.exchange(
                url, 
                HttpMethod.valueOf(method.toUpperCase()), 
                entity, 
                Object.class
            );
            return response.getBody();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    @Override
    public String getType() {
        return "RPC";
    }
}
