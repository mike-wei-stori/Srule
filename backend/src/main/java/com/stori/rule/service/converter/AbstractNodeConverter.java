package com.stori.rule.service.converter;

import com.stori.rule.dto.EdgeDto;
import com.stori.rule.dto.NodeDto;
import com.stori.rule.entity.RuleVariable;

import java.util.List;
import java.util.Map;

public abstract class AbstractNodeConverter implements NodeConverter {

    protected String getAgendaGroup(String nodeId) {
        return "GROUP_" + nodeId;
    }

    protected String getRuleName(NodeDto node, ConverterContext context) {
        String label = (String) node.getData().get("label");
        if (label != null && !label.trim().isEmpty()) {
            // Sanitize label
            return context.getPackageCode() + "_" + label.replaceAll("[^a-zA-Z0-9_]", "_") + "_" + node.getId();
        }
        return context.getPackageCode() + "_" + node.getId();
    }

    protected String getNextNodeId(NodeDto node, ConverterContext context) {
        List<EdgeDto> edges = context.getOutgoingEdges(node.getId());
        if (edges.isEmpty()) return null;
        return edges.get(0).getTarget();
    }
    
    protected String formatValue(String parameterCode, Object value, Map<String, RuleVariable> variableMap) {
        if (value == null) return "null";
        
        RuleVariable variable = variableMap.get(parameterCode);
        if (variable == null) {
            if (value instanceof String) return "\"" + value + "\"";
            return value.toString();
        }
        
        String type = variable.getType();
        if ("STRING".equalsIgnoreCase(type) || "DATE".equalsIgnoreCase(type)) {
            return "\"" + value + "\"";
        }
        return value.toString();
    }

    protected String generateConditionDrl(String parameter, String operator, Object value, Map<String, RuleVariable> variableMap) {
        if (parameter == null) return "true";

        RuleVariable variable = variableMap.get(parameter);
        String type = variable != null ? variable.getType() : "STRING";
        String lhs = "$context.get(\"" + parameter + "\")";
        String valStr = value != null ? value.toString() : "";

        // Null checks
        if ("isNull".equals(operator)) return lhs + " == null";
        if ("isNotNull".equals(operator)) return lhs + " != null";

        // Collection checks
        if ("isEmpty".equals(operator)) {
            if ("LIST".equalsIgnoreCase(type)) return lhs + " != null && ((java.util.List)" + lhs + ").isEmpty()";
            if ("MAP".equalsIgnoreCase(type)) return lhs + " != null && ((java.util.Map)" + lhs + ").isEmpty()";
            return "false";
        }
        if ("isNotEmpty".equals(operator)) {
            if ("LIST".equalsIgnoreCase(type)) return lhs + " != null && !((java.util.List)" + lhs + ").isEmpty()";
            if ("MAP".equalsIgnoreCase(type)) return lhs + " != null && !((java.util.Map)" + lhs + ").isEmpty()";
            return "false";
        }

        // Value checks (requires value)
        if (value == null && !operator.contains("Null") && !operator.contains("Empty")) return "false";

        if ("INTEGER".equalsIgnoreCase(type) || "DOUBLE".equalsIgnoreCase(type) || "NUMBER".equalsIgnoreCase(type)) {
            String numLhs = "((Number)" + lhs + ").doubleValue()";
            String numRhs = valStr;
            try {
                Double.parseDouble(numRhs);
            } catch (Exception e) {
                // If value is not a number, maybe it's a variable reference? For now assume 0 if invalid
                if (!numRhs.matches("-?\\d+(\\.\\d+)?")) numRhs = "0"; 
            }

            switch (operator) {
                case "==": return lhs + " != null && " + numLhs + " == " + numRhs;
                case "!=": return lhs + " != null && " + numLhs + " != " + numRhs;
                case ">": return lhs + " != null && " + numLhs + " > " + numRhs;
                case ">=": return lhs + " != null && " + numLhs + " >= " + numRhs;
                case "<": return lhs + " != null && " + numLhs + " < " + numRhs;
                case "<=": return lhs + " != null && " + numLhs + " <= " + numRhs;
                case "in": return "java.util.Arrays.asList(" + valStr + ".split(\",\")).contains(String.valueOf(" + numLhs + "))";
                case "not in": return "!java.util.Arrays.asList(" + valStr + ".split(\",\")).contains(String.valueOf(" + numLhs + "))";
                default: return "false";
            }
        } else if ("BOOLEAN".equalsIgnoreCase(type)) {
             String boolRhs = Boolean.parseBoolean(valStr) ? "true" : "false";
             if ("==".equals(operator)) return "java.util.Objects.equals(" + lhs + ", " + boolRhs + ")";
             if ("!=".equals(operator)) return "!java.util.Objects.equals(" + lhs + ", " + boolRhs + ")";
             return "false";
        } else if ("DATE".equalsIgnoreCase(type)) {
            // Assuming Date is stored as String or Date object. 
            // If String, we need standard format. If Date, we can compare.
            // Let's assume standard ISO string for now or Comparable.
            // Safe bet: treat as Comparable if possible, or String comparison for equality.
            // For > <, we need conversion. 
            // Simplification: Assume String comparison for now or implement DateUtil helper in DRL.
            // Let's use String comparison for simplicity as a fallback, but it's risky.
            // Better: ((Comparable)v1).compareTo(v2)
            String dateRhs = "\"" + valStr.replace("\"", "") + "\"";
            String dateCheck = lhs + " != null";
            
            switch (operator) {
                case "==": return "java.util.Objects.equals(" + lhs + ", " + dateRhs + ")";
                case "!=": return "!java.util.Objects.equals(" + lhs + ", " + dateRhs + ")";
                case ">": return dateCheck + " && ((Comparable)" + lhs + ").compareTo(" + dateRhs + ") > 0";
                case ">=": return dateCheck + " && ((Comparable)" + lhs + ").compareTo(" + dateRhs + ") >= 0";
                case "<": return dateCheck + " && ((Comparable)" + lhs + ").compareTo(" + dateRhs + ") < 0";
                case "<=": return dateCheck + " && ((Comparable)" + lhs + ").compareTo(" + dateRhs + ") <= 0";
                default: return "false";
            }
        } else if ("LIST".equalsIgnoreCase(type)) {
            String listRhs = "\"" + valStr.replace("\"", "") + "\"";
             if ("contains".equals(operator)) return lhs + " != null && ((java.util.List)" + lhs + ").contains(" + listRhs + ")";
             if ("not contains".equals(operator)) return lhs + " != null && !((java.util.List)" + lhs + ").contains(" + listRhs + ")";
             return "false";
        } else if ("MAP".equalsIgnoreCase(type)) {
            String mapRhs = "\"" + valStr.replace("\"", "") + "\"";
            if ("containsKey".equals(operator)) return lhs + " != null && ((java.util.Map)" + lhs + ").containsKey(" + mapRhs + ")";
            if ("containsValue".equals(operator)) return lhs + " != null && ((java.util.Map)" + lhs + ").containsValue(" + mapRhs + ")";
            return "false";
        } else {
            // STRING and others
            String strRhs = "\"" + valStr.replace("\"", "") + "\"";
            String strCheck = lhs + " != null";
            
            switch (operator) {
                case "==": return "java.util.Objects.equals(" + lhs + ", " + strRhs + ")";
                case "!=": return "!java.util.Objects.equals(" + lhs + ", " + strRhs + ")";
                case "contains": return strCheck + " && ((String)" + lhs + ").contains(" + strRhs + ")";
                case "not contains": return strCheck + " && !((String)" + lhs + ").contains(" + strRhs + ")";
                case "startsWith": return strCheck + " && ((String)" + lhs + ").startsWith(" + strRhs + ")";
                case "endsWith": return strCheck + " && ((String)" + lhs + ").endsWith(" + strRhs + ")";
                case "matches": return strCheck + " && ((String)" + lhs + ").matches(" + strRhs + ")";
                case "in": return "java.util.Arrays.asList(" + strRhs + ".split(\",\")).contains(" + lhs + ")";
                case "not in": return "!java.util.Arrays.asList(" + strRhs + ".split(\",\")).contains(" + lhs + ")";
                default: return "false";
            }
        }
    }
}
