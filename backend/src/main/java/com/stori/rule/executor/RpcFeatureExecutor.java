package com.stori.rule.executor;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.alipay.sofa.rpc.api.GenericService;
import com.alipay.sofa.rpc.config.ConsumerConfig;
import com.stori.rule.entity.Feature;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RpcFeatureExecutor implements FeatureExecutor {

    private final Map<String, GenericService> serviceCache = new ConcurrentHashMap<>();

    @Override
    public Object execute(Feature feature, Map<String, Object> context) {
        JSONObject config = JSON.parseObject(feature.getConfig());
        String interfaceName = config.getString("interfaceName");
        String method = config.getString("method");
        String group = config.getString("group");
        String version = config.getString("version");
        String uniqueId = config.getString("uniqueId");
        
        // Generate cache key based on service identity
        String cacheKey = String.format("%s:%s:%s:%s", interfaceName, group, version, uniqueId);
        
        GenericService genericService = serviceCache.computeIfAbsent(cacheKey, k -> {
            ConsumerConfig<GenericService> consumerConfig = new ConsumerConfig<GenericService>()
                .setInterfaceId(interfaceName)
                .setGeneric(true)
                .setProtocol("bolt")
                .setGroup(group)
                .setVersion(version)
                .setUniqueId(uniqueId)
                .setTimeout(3000);
            return consumerConfig.refer();
        });

        // Prepare arguments
        // Assuming context contains args in order or we need a way to map them.
        // For simplicity, let's assume the config defines arg types and values are in context or fixed.
        // But usually RPC args are positional.
        // Let's assume 'args' in config is a list of objects defining type and value/expression.
        
        // For now, to match the previous implementation's flexibility, let's assume we pass the whole context map 
        // if the method signature expects a Map, or we need a more complex mapping.
        // However, GenericService.$invoke takes (String methodName, String[] argTypes, Object[] args).
        
        // Let's try to get argTypes and args from config or context.
        // If not present, maybe we just pass the context as a single map argument?
        // Let's look at how the previous implementation did it: it replaced placeholders in URL.
        
        // Let's assume the config has "argTypes" and "args" (which can use placeholders).
        
        List<String> argTypesList = config.getJSONArray("argTypes").toJavaList(String.class);
        String[] argTypes = argTypesList.toArray(new String[0]);
        
        JSONArray argsConfig = config.getJSONArray("args");
        Object[] args = new Object[argsConfig.size()];
        for (int i = 0; i < argsConfig.size(); i++) {
            Object argDef = argsConfig.get(i);
            // Simple placeholder replacement if string
            if (argDef instanceof String && ((String) argDef).startsWith("{") && ((String) argDef).endsWith("}")) {
                String key = ((String) argDef).substring(1, ((String) argDef).length() - 1);
                args[i] = context.get(key);
            } else {
                args[i] = argDef;
            }
        }

        return genericService.$invoke(method, argTypes, args);
    }

    @Override
    public String getType() {
        return "RPC";
    }
}
