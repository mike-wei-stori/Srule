package com.stori.rule.service.converter.impl;

import com.stori.rule.dto.EdgeDto;
import com.stori.rule.dto.NodeDto;
import com.stori.rule.entity.RuleVariable;
import com.stori.rule.service.converter.AbstractNodeConverter;
import com.stori.rule.service.converter.ConverterContext;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class DecisionNodeConverter extends AbstractNodeConverter {
    @Override
    public boolean supports(String nodeType) {
        return "DECISION".equalsIgnoreCase(nodeType);
    }

    @Override
    public String convert(NodeDto node, ConverterContext context) {
        StringBuilder drl = new StringBuilder();
        List<EdgeDto> edges = context.getOutgoingEdges(node.getId());
        Map<String, Object> data = node.getData();
        List<Map<String, Object>> conditions = (List<Map<String, Object>>) data.get("conditions");
        
        // If no conditions array, fallback to legacy single condition logic
        if (conditions == null || conditions.isEmpty()) {
            return convertLegacy(node, context, edges, drl);
        }

        String logic = (String) data.getOrDefault("conditionLogic", "AND");
        String joinOp = "OR".equalsIgnoreCase(logic) ? " || " : " && ";

        // Build combined condition string
        StringBuilder combinedCondition = new StringBuilder();
        for (int i = 0; i < conditions.size(); i++) {
            Map<String, Object> cond = conditions.get(i);
            String c = generateSingleCondition(node, cond, context.getVariableMap());
            combinedCondition.append("(").append(c).append(")");
            if (i < conditions.size() - 1) {
                combinedCondition.append(joinOp);
            }
        }
        
        String finalCondition = combinedCondition.toString();
        if (finalCondition.isEmpty()) {
            finalCondition = "true";
        }

        // Generate rules for True and False branches
        for (EdgeDto edge : edges) {
            String targetId = edge.getTarget();
            String handle = edge.getSourceHandle();
            String label = edge.getLabel();
            
            // Strict check: handle "true" -> True, handle "false" -> False
            // Fallback: label "True" -> True, label "False" -> False
            // Default: if neither, assume True (or skip? let's assume True for flow continuity if ambiguous)
            
            boolean isTrue = true;
            if (handle != null) {
                isTrue = "true".equalsIgnoreCase(handle);
            } else if (label != null) {
                isTrue = "true".equalsIgnoreCase(label) || "yes".equalsIgnoreCase(label);
            } else {
                // If no handle and no label, check if we already have a True edge?
                // For now, default to True unless it looks like a False edge
                isTrue = true;
            }
            
            String ruleName = getRuleName(node, context) + "_" + (isTrue ? "TRUE" : "FALSE") + "_" + targetId;
            
            drl.append("// Rule for edge to ").append(targetId).append(" (").append(isTrue ? "True" : "False").append(")\n");
            drl.append("rule \"").append(ruleName).append("\"\n");
            drl.append("    agenda-group \"").append(getAgendaGroup(node.getId())).append("\"\n");
            drl.append("when\n");
            drl.append("    $context : Map()\n");
            
            String conditionStr;
            if (isTrue) {
                conditionStr = "eval(" + finalCondition + ")";
            } else {
                conditionStr = "eval(!(" + finalCondition + "))";
            }
            
            drl.append("    ").append(conditionStr).append("\n");
            
            drl.append("then\n");
            drl.append("    System.out.println(\"Decision ").append(isTrue ? "True" : "False").append(" -> ").append(targetId).append("\");\n");
            drl.append("    kcontext.getKnowledgeRuntime().getAgenda().getAgendaGroup(\"")
               .append(getAgendaGroup(targetId)).append("\").setFocus();\n");
            drl.append("end\n\n");
        }
        return drl.toString();
    }

    private String convertLegacy(NodeDto node, ConverterContext context, List<EdgeDto> edges, StringBuilder drl) {
        for (EdgeDto edge : edges) {
            String targetId = edge.getTarget();
            String label = edge.getSourceHandle() != null ? edge.getSourceHandle() : edge.getLabel();
            boolean isTrue = "true".equalsIgnoreCase(label);
            
            String ruleName = getRuleName(node, context) + "_" + (isTrue ? "TRUE" : "FALSE") + "_" + targetId;
            
            drl.append("rule \"").append(ruleName).append("\"\n");
            drl.append("    agenda-group \"").append(getAgendaGroup(node.getId())).append("\"\n");
            drl.append("when\n");
            drl.append("    $context : Map()\n");
            
            String condition = generateCondition(node, isTrue, context.getVariableMap());
            drl.append("    ").append(condition).append("\n");
            
            drl.append("then\n");
            drl.append("    System.out.println(\"Decision ").append(isTrue ? "True" : "False").append(" -> ").append(targetId).append("\");\n");
            drl.append("    kcontext.getKnowledgeRuntime().getAgenda().getAgendaGroup(\"")
               .append(getAgendaGroup(targetId)).append("\").setFocus();\n");
            drl.append("end\n\n");
        }
        return drl.toString();
    }
    
    private String generateSingleCondition(NodeDto node, Map<String, Object> conditionData, Map<String, RuleVariable> variableMap) {
        String parameter = (String) conditionData.get("parameter");
        String operator = (String) conditionData.getOrDefault("operator", "==");
        Object value = conditionData.get("value");
        return generateConditionDrl(parameter, operator, value, variableMap);
    }

    private String generateCondition(NodeDto node, boolean isTrue, Map<String, RuleVariable> variableMap) {
        Map<String, Object> data = node.getData();
        String logicType = (String) data.getOrDefault("logicType", "CONDITION");
        
        if ("EXPRESSION".equalsIgnoreCase(logicType)) {
            String expression = (String) data.get("expression");
            if (expression != null && !expression.isEmpty()) {
                return isTrue ? "eval(" + expression + ")" : "eval(!(" + expression + "))";
            }
        } else {
            // Re-use generateSingleCondition logic but adapted for legacy structure
            // Or just keep legacy logic as is
            String parameter = (String) data.get("parameter");
            String operator = (String) data.getOrDefault("operator", "==");
            Object value = data.get("value");
            
            if (parameter != null && value != null) {
                if (!isTrue) {
                    operator = invertOperator(operator);
                }
                
                Map<String, Object> tempCond = new java.util.HashMap<>();
                tempCond.put("operator", operator);
                tempCond.put("value", value);
                
                return "eval(" + generateSingleCondition(node, tempCond, variableMap) + ")";
            }
        }
        return "eval(" + isTrue + ")"; // Default fallback
    }
    
    private String invertOperator(String operator) {
        switch (operator) {
            case "==": return "!=";
            case "!=": return "==";
            case ">": return "<=";
            case ">=": return "<";
            case "<": return ">=";
            case "<=": return ">";
            case "contains": return "not contains";
            case "not contains": return "contains";
            case "in": return "not in";
            case "not in": return "in";
            case "isNull": return "isNotNull";
            case "isNotNull": return "isNull";
            default: return operator;
        }
    }
}
