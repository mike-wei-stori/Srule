package com.stori.rule.service.converter.impl;

import com.stori.rule.dto.EdgeDto;
import com.stori.rule.dto.NodeDto;
import com.stori.rule.entity.RuleVariable;
import com.stori.rule.service.converter.AbstractNodeConverter;
import com.stori.rule.service.converter.ConverterContext;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class DecisionTableNodeConverter extends AbstractNodeConverter {
    @Override
    public boolean supports(String nodeType) {
        return "DECISION_TABLE".equalsIgnoreCase(nodeType);
    }

    @Override
    public String convert(NodeDto node, ConverterContext context) {
        StringBuilder drl = new StringBuilder();
        List<EdgeDto> edges = context.getOutgoingEdges(node.getId());
        Map<String, Object> data = node.getData();
        
        List<Map<String, Object>> branches = (List<Map<String, Object>>) data.get("branches");
        if (branches == null) branches = new ArrayList<>();
        
        // Map branch ID to branch definition
        Map<String, Map<String, Object>> branchMap = branches.stream()
            .collect(Collectors.toMap(
                b -> (String) b.get("id"),
                b -> b
            ));

        for (EdgeDto edge : edges) {
            String targetId = edge.getTarget();
            String handle = edge.getSourceHandle();
            
            if (!branchMap.containsKey(handle)) continue;
            
            Map<String, Object> branch = branchMap.get(handle);
            String ruleName = getRuleName(node, context) + "_" + handle + "_" + targetId;
            
            drl.append("rule \"").append(ruleName).append("\"\n");
            drl.append("    agenda-group \"").append(getAgendaGroup(node.getId())).append("\"\n");
            drl.append("when\n");
            drl.append("    $context : Map()\n");
            
            String condition = generateCondition(branch, context.getVariableMap());
            
            drl.append("    ").append("eval(").append(condition).append(")\n");
            
            drl.append("then\n");
            drl.append("    System.out.println(\"DecisionTable ").append(handle).append(" -> ").append(targetId).append("\");\n");
            drl.append("    kcontext.getKnowledgeRuntime().getAgenda().getAgendaGroup(\"")
               .append(getAgendaGroup(targetId)).append("\").setFocus();\n");
            drl.append("end\n\n");
        }
        
        return drl.toString();
    }
    
    private String generateCondition(Map<String, Object> branch, Map<String, RuleVariable> variableMap) {
        String type = (String) branch.getOrDefault("type", "CONDITION");
        
        if ("EXPRESSION".equalsIgnoreCase(type)) {
            String expr = (String) branch.get("expression");
            return (expr != null && !expr.isEmpty()) ? expr : "true";
        } else {
            // Condition
            String parameter = (String) branch.get("parameter");
            String operator = (String) branch.getOrDefault("operator", "==");
            Object value = branch.get("value");
            
            if (parameter == null) return "true";
            
            RuleVariable variable = variableMap.get(parameter);
            String varType = variable != null ? variable.getType() : "STRING";
            
            String lhs = "$context.get(\"" + parameter + "\")";
            String valStr = value != null ? value.toString() : "";
            
            if ("INTEGER".equalsIgnoreCase(varType) || "DOUBLE".equalsIgnoreCase(varType) || "NUMBER".equalsIgnoreCase(varType)) {
                lhs = "((Number)" + lhs + ").doubleValue()";
                try {
                    Double.parseDouble(valStr);
                } catch (NumberFormatException e) {
                    valStr = "0";
                }
                return lhs + " " + operator + " " + valStr;
            } else {
                // String ops
                String rhs = "\"" + valStr.replace("\"", "") + "\"";
                
                if ("==".equals(operator)) {
                    return "java.util.Objects.equals(" + lhs + ", " + rhs + ")";
                } else if ("!=".equals(operator)) {
                    return "!java.util.Objects.equals(" + lhs + ", " + rhs + ")";
                } else if ("contains".equals(operator)) {
                    return lhs + " != null && ((String)" + lhs + ").contains(" + rhs + ")";
                }
                // Add more ops if needed
                return "java.util.Objects.equals(" + lhs + ", " + rhs + ")";
            }
        }
    }
}
