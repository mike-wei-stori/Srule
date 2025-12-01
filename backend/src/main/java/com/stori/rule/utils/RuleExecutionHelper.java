package com.stori.rule.utils;

import com.stori.rule.service.DroolsService;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class RuleExecutionHelper implements ApplicationContextAware {

    private static ApplicationContext applicationContext;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        RuleExecutionHelper.applicationContext = applicationContext;
    }

    public static Map<String, Object> execute(String packageCode, Map<String, Object> inputs) {
        if (applicationContext == null) {
            throw new RuntimeException("ApplicationContext not initialized");
        }
        DroolsService droolsService = applicationContext.getBean(DroolsService.class);
        return droolsService.execute(packageCode, inputs);
    }

    /**
     * Safely converts value to the target type.
     * Supports String -> Integer/Double/Boolean/Long conversions.
     */
    public static Object convert(Object value, String targetType) {
        if (value == null) return null;
        if (targetType == null) return value; // No target type specified, return as is

        String strVal = value.toString();

        try {
            switch (targetType.toUpperCase()) {
                case "INTEGER":
                case "INT":
                    if (value instanceof Number) return ((Number) value).intValue();
                    return Integer.valueOf(strVal);
                case "DOUBLE":
                case "FLOAT":
                    if (value instanceof Number) return ((Number) value).doubleValue();
                    return Double.valueOf(strVal);
                case "BOOLEAN":
                    if (value instanceof Boolean) return value;
                    return Boolean.valueOf(strVal);
                case "LONG":
                    if (value instanceof Number) return ((Number) value).longValue();
                    return Long.valueOf(strVal);
                case "STRING":
                    return strVal;
                default:
                    return value;
            }
        } catch (Exception e) {
            // Log warning? For now just return original value and let it fail or work if compatible
            return value;
        }
    }
    /**
     * Extracts value from context using simple expression language.
     * Supports:
     * - Simple variable: "var"
     * - List index: "list[0]"
     * - Map key: "map.key" or "map['key']"
     */
    public static Object extractValue(Map<String, Object> context, String expression) {
        if (expression == null) return null;
        
        // Handle Literals
        if (expression.startsWith("\"") && expression.endsWith("\"")) {
            return expression.substring(1, expression.length() - 1);
        }
        if (expression.startsWith("'") && expression.endsWith("'")) {
            return expression.substring(1, expression.length() - 1);
        }
        if ("true".equalsIgnoreCase(expression)) return Boolean.TRUE;
        if ("false".equalsIgnoreCase(expression)) return Boolean.FALSE;
        if (expression.matches("-?\\d+(\\.\\d+)?")) {
            if (expression.contains(".")) return Double.valueOf(expression);
            return Integer.valueOf(expression);
        }

        if (context == null) return null;

        // Simple case
        if (!expression.contains("[") && !expression.contains(".")) {
            return context.get(expression);
        }

        // Complex case: parse expression
        // This is a simplified implementation. For full support, consider using MVEL or SpEL.
        try {
            String[] parts = expression.split("\\.|(?=\\[)");
            Object current = context;
            
            for (String part : parts) {
                if (current == null) return null;
                
                if (part.startsWith("[")) {
                    // Array/List index: [0] or ['key']
                    int end = part.indexOf("]");
                    String key = part.substring(1, end);
                    
                    if (key.startsWith("'") || key.startsWith("\"")) {
                        // Map key
                        key = key.replace("'", "").replace("\"", "");
                        if (current instanceof Map) {
                            current = ((Map) current).get(key);
                        } else {
                            return null;
                        }
                    } else {
                        // List index
                        int index = Integer.parseInt(key);
                        if (current instanceof java.util.List) {
                            current = ((java.util.List) current).get(index);
                        } else if (current.getClass().isArray()) {
                            current = java.lang.reflect.Array.get(current, index);
                        } else {
                            return null;
                        }
                    }
                } else {
                    // Property or Map key
                    if (current instanceof Map) {
                        current = ((Map) current).get(part);
                    } else {
                        // Try reflection for bean property?
                        // For now assume Map based context
                        return null;
                    }
                }
            }
            return current;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Assigns value to context using expression.
     */
    public static void assignValue(Map<String, Object> context, String expression, Object value) {
        if (expression == null || context == null) return;

        // Simple case
        if (!expression.contains("[") && !expression.contains(".")) {
            context.put(expression, value);
            return;
        }

        // Complex case: traverse and set
        try {
            // Logic to traverse and set... 
            // This is tricky because we need to know if we are setting a Map key or List index.
            // Simplified: only support setting root map keys for now, or simple nested maps.
            // Implementing full setter logic is complex. 
            // Let's support basic "map.key" and "list[i]" where parent exists.
            
            // For now, let's just handle the simple case of "map.key" -> context.get("map").put("key", value)
            // and "list[0]" -> context.get("list").set(0, value)
            
            // TODO: Implement full path setting if needed.
            // Current requirement: "support value extraction and assignment".
            
            // Let's try to handle the last part.
            // Split into parent path and leaf.
            // This is getting complicated for a helper. 
            // Let's assume the user uses this for simple nested structures.
            
            // Re-use logic or just support simple one-level nesting for now?
            // "param.field"
            int lastDot = expression.lastIndexOf(".");
            int lastBracket = expression.lastIndexOf("[");
            
            if (lastDot > lastBracket) {
                // map.key
                String parentPath = expression.substring(0, lastDot);
                String key = expression.substring(lastDot + 1);
                Object parent = extractValue(context, parentPath);
                if (parent instanceof Map) {
                    ((Map) parent).put(key, value);
                }
            } else if (lastBracket > -1) {
                // list[0]
                String parentPath = expression.substring(0, lastBracket);
                String indexStr = expression.substring(lastBracket + 1, expression.length() - 1);
                Object parent = extractValue(context, parentPath);
                
                if (parent instanceof java.util.List) {
                    int index = Integer.parseInt(indexStr);
                    java.util.List list = (java.util.List) parent;
                    if (index < list.size()) {
                        list.set(index, value);
                    } else {
                        // Expand? or Error?
                        // For safety, maybe add if index == size
                        if (index == list.size()) list.add(value);
                    }
                } else if (parent instanceof Map) {
                     String key = indexStr.replace("'", "").replace("\"", "");
                     ((Map) parent).put(key, value);
                }
            }
        } catch (Exception e) {
            // Ignore
        }
    }
}
