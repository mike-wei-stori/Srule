package com.stori.rule.service.converter.impl;

import com.stori.rule.dto.NodeDto;
import com.stori.rule.entity.RuleVariable;
import com.stori.rule.service.converter.AbstractNodeConverter;
import com.stori.rule.service.converter.ConverterContext;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Component
public class ActionNodeConverter extends AbstractNodeConverter {

    @Override
    public boolean supports(String nodeType) {
        return "ACTION".equalsIgnoreCase(nodeType);
    }

    @Override
    public String convert(NodeDto node, ConverterContext context) {
        StringBuilder drl = new StringBuilder();
        String ruleName = getRuleName(node, context);
        
        drl.append("rule \"").append(ruleName).append("\"\n");
        drl.append("    agenda-group \"").append(getAgendaGroup(node.getId())).append("\"\n");
        drl.append("when\n");
        drl.append("    $context : Map()\n");
        drl.append("then\n");
        
        // Action Logic
        Map<String, Object> data = node.getData();
        Map<String, RuleVariable> variableMap = context.getVariableMap();
        
        if (data.containsKey("actions")) {
            List<Map<String, Object>> actions = (List<Map<String, Object>>) data.get("actions");
            for (Map<String, Object> action : actions) {
                processAction(drl, action, variableMap);
            }
        } else {
            // Legacy support
            processAction(drl, data, variableMap);
        }

        List<String> nextNodeIds = getNextNodeIds(node, context);
        if (nextNodeIds != null && !nextNodeIds.isEmpty()) {
            for (String nextNodeId : nextNodeIds) {
                drl.append("    kcontext.getKnowledgeRuntime().getAgenda().getAgendaGroup(\"")
                   .append(getAgendaGroup(nextNodeId)).append("\").setFocus();\n");
            }
        }
        drl.append("end\n\n");
        return drl.toString();
    }

    private void processAction(StringBuilder drl, Map<String, Object> actionData, Map<String, RuleVariable> variableMap) {
        String targetParameter = (String) actionData.get("targetParameter");
        if (targetParameter == null) return;

        String operation = (String) actionData.getOrDefault("operation", "=");
        Object assignmentValue = actionData.get("assignmentValue");
        
        // Resolve variable type
        String varType = "STRING";
        if (variableMap.containsKey(targetParameter)) {
            varType = variableMap.get(targetParameter).getType();
        }

        // Resolve value expression (handles references and literals)
        String valueExpression = resolveValueExpression(targetParameter, assignmentValue, variableMap);

        generateActionDrl(drl, targetParameter, operation, valueExpression, varType, assignmentValue);
    }

    private String resolveValueExpression(String targetParameter, Object value, Map<String, RuleVariable> variableMap) {
        if (value instanceof String) {
            String valStr = (String) value;
            if (isReference(valStr)) {
                String refCode = valStr.substring(3);
                RuleVariable targetVar = variableMap != null ? variableMap.get(targetParameter) : null;
                String targetType = targetVar != null ? targetVar.getType() : "Object";
                String javaType = getJavaType(targetType);
                return "(" + javaType + ") $context.get(\"" + refCode + "\")";
            }
        }
        return formatValue(targetParameter, value, variableMap);
    }

    private boolean isReference(String value) {
        return value != null && (value.startsWith("$f.") || value.startsWith("$t.") || value.startsWith("$o.") || value.startsWith("$v."));
    }

    private void generateActionDrl(StringBuilder drl, String target, String op, String valueExpr, String type, Object originalValue) {
        drl.append("    // Action: ").append(target).append(" ").append(op).append(" ").append(valueExpr).append("\n");
        drl.append("    {\n");
        
        switch (type.toUpperCase()) {
            case "INTEGER":
            case "DOUBLE":
                generateNumberAction(drl, target, op, valueExpr, type);
                break;
            case "STRING":
                generateStringAction(drl, target, op, valueExpr);
                break;
            case "LIST":
                generateListAction(drl, target, op, valueExpr, originalValue);
                break;
            case "MAP":
                generateMapAction(drl, target, op, valueExpr, originalValue);
                break;
            default:
                drl.append("        $context.put(\"").append(target).append("\", ").append(valueExpr).append(");\n");
        }
        
        // Debug output (escape quotes for display)
        String displayValue = String.valueOf(originalValue).replace("\"", "\\\"");
        drl.append("        System.out.println(\"Action: Updated ").append(target).append(" (").append(op).append(") with ").append(displayValue).append("\");\n");
        drl.append("    }\n");
    }

    private void generateNumberAction(StringBuilder drl, String target, String op, String valueExpr, String type) {
        String castType = "INTEGER".equalsIgnoreCase(type) ? "Integer" : "Double";
        
        drl.append("        ").append(castType).append(" currentVal = (").append(castType).append(") $context.get(\"").append(target).append("\");\n");
        drl.append("        if (currentVal == null) currentVal = 0;\n");
        
        String calcOp;
        switch (op) {
            case "+=": calcOp = "+"; break;
            case "-=": calcOp = "-"; break;
            case "*=": calcOp = "*"; break;
            case "/=": calcOp = "/"; break;
            default:   calcOp = null;
        }

        if (calcOp != null) {
            drl.append("        $context.put(\"").append(target).append("\", currentVal ").append(calcOp).append(" ").append(valueExpr).append(");\n");
        } else {
            drl.append("        $context.put(\"").append(target).append("\", ").append(valueExpr).append(");\n");
        }
    }

    private void generateStringAction(StringBuilder drl, String target, String op, String valueExpr) {
        if ("append".equals(op) || "prepend".equals(op)) {
            drl.append("        String sVal = (String) $context.get(\"").append(target).append("\");\n");
            drl.append("        if (sVal == null) sVal = \"\";\n");
            
            if ("append".equals(op)) {
                drl.append("        $context.put(\"").append(target).append("\", sVal + ").append(valueExpr).append(");\n");
            } else {
                drl.append("        $context.put(\"").append(target).append("\", ").append(valueExpr).append(" + sVal);\n");
            }
        } else {
            drl.append("        $context.put(\"").append(target).append("\", ").append(valueExpr).append(");\n");
        }
    }

    private void generateListAction(StringBuilder drl, String target, String op, String valueExpr, Object originalValue) {
        // Handle List Builder Assignment (List<String>)
        // Fix: 检查 originalValue 是否为 List 类型，而不是尝试将其转换为 String
        if ("=".equals(op) && originalValue instanceof List) { 
             List<?> list = (List<?>) originalValue;
             StringBuilder sb = new StringBuilder();
             sb.append("new java.util.ArrayList(java.util.Arrays.asList(");
             for (int i = 0; i < list.size(); i++) {
                 String item = String.valueOf(list.get(i));
                 if (isReference(item)) {
                     String refCode = item.substring(3);
                     sb.append("$context.get(\"").append(refCode).append("\")");
                 } else {
                     sb.append("\"").append(item).append("\"");
                 }
                 if (i < list.size() - 1) sb.append(", ");
             }
             sb.append("))");
             drl.append("        $context.put(\"").append(target).append("\", ").append(sb.toString()).append(");\n");
             return;
        }

        if ("=".equals(op)) {
            drl.append("        $context.put(\"").append(target).append("\", ").append(valueExpr).append(");\n");
            return;
        }

        // For add/remove, we need the existing list
        drl.append("        java.util.List listVal = (java.util.List) $context.get(\"").append(target).append("\");\n");
        drl.append("        if (listVal == null) { listVal = new java.util.ArrayList(); $context.put(\"").append(target).append("\", listVal); }\n");
        
        if ("add".equals(op)) {
            drl.append("        listVal.add(").append(valueExpr).append(");\n");
        } else if ("remove".equals(op)) {
            drl.append("        listVal.remove(").append(valueExpr).append(");\n");
        }
    }

    private void generateMapAction(StringBuilder drl, String target, String op, String valueExpr, Object originalValue) {
        // Handle Map Builder Assignment (List of {key, value})
        if ("=".equals(op) && originalValue instanceof List) {
            List<Map<String, String>> entries = (List<Map<String, String>>) originalValue;
            drl.append("        java.util.Map newMap = new java.util.HashMap();\n");
            for (Map<String, String> entry : entries) {
                String k = entry.get("key");
                String v = entry.get("value");
                if (k != null && !k.isEmpty()) {
                    // Check if value is a reference
                    String valToPut = "\"" + v + "\"";
                    if (isReference(v)) {
                         String refCode = v.substring(3);
                         valToPut = "$context.get(\"" + refCode + "\")";
                    }
                    drl.append("        newMap.put(\"").append(k).append("\", ").append(valToPut).append(");\n");
                }
            }
            drl.append("        $context.put(\"").append(target).append("\", newMap);\n");
            return;
        }

        if ("=".equals(op)) {
            drl.append("        $context.put(\"").append(target).append("\", ").append(valueExpr).append(");\n");
            return;
        }

        if ("remove".equals(op)) {
            drl.append("        java.util.Map mapVal = (java.util.Map) $context.get(\"").append(target).append("\");\n");
            drl.append("        if (mapVal != null) mapVal.remove(").append(valueExpr).append(");\n");
            return;
        }

        if ("put".equals(op) && originalValue instanceof Map) {
            Map<String, Object> valMap = (Map<String, Object>) originalValue;
            String key = (String) valMap.get("key");
            String value = (String) valMap.get("value");
            
            String valToPut = "\"" + value + "\"";
            if (isReference(value)) {
                 String refCode = value.substring(3);
                 valToPut = "$context.get(\"" + refCode + "\")";
            }

            drl.append("        java.util.Map mapVal = (java.util.Map) $context.get(\"").append(target).append("\");\n");
            drl.append("        if (mapVal == null) { mapVal = new java.util.HashMap(); $context.put(\"").append(target).append("\", mapVal); }\n");
            drl.append("        mapVal.put(\"").append(key).append("\", ").append(valToPut).append(");\n");
            return;
        }

        // Default fallback
        drl.append("        $context.put(\"").append(target).append("\", ").append(valueExpr).append(");\n");
    }

    private String getJavaType(String type) {
        if (type == null) return "Object";
        switch (type.toUpperCase()) {
            case "STRING": return "String";
            case "INTEGER": return "Integer";
            case "DOUBLE": return "Double";
            case "BOOLEAN": return "Boolean";
            case "DATE": return "java.util.Date";
            case "LIST": return "java.util.List";
            case "MAP": return "java.util.Map";
            default: return "Object";
        }
    }
}
