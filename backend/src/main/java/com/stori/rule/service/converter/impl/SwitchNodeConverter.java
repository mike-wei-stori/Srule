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
import java.util.Objects;
import java.util.stream.Collectors;

@Component
public class SwitchNodeConverter extends AbstractNodeConverter {
    @Override
    public boolean supports(String nodeType) {
        return "SWITCH".equalsIgnoreCase(nodeType);
    }

    @Override
    public String convert(NodeDto node, ConverterContext context) {
        StringBuilder drl = new StringBuilder();
        List<EdgeDto> edges = context.getOutgoingEdges(node.getId());
        Map<String, Object> data = node.getData();
        
        String parameter = (String) data.get("parameter");
        List<Map<String, Object>> cases = (List<Map<String, Object>>) data.get("cases");
        if (cases == null) cases = new ArrayList<>();
        
        // Map case ID to value for easy lookup
        Map<String, String> caseValues = cases.stream()
            .collect(Collectors.toMap(
                c -> (String) c.get("id"),
                c -> String.valueOf(c.get("value"))
            ));

        for (EdgeDto edge : edges) {
            String targetId = edge.getTarget();
            String handle = edge.getSourceHandle();
            
            String ruleName = getRuleName(node, context) + "_" + handle + "_" + targetId;
            
            drl.append("rule \"").append(ruleName).append("\"\n");
            drl.append("    agenda-group \"").append(getAgendaGroup(node.getId())).append("\"\n");
            drl.append("when\n");
            drl.append("    $context : Map()\n");
            
            String condition = "true";
            if ("default".equals(handle)) {
                // Default case: parameter != any of the defined case values
                if (!caseValues.isEmpty()) {
                    List<String> negations = new ArrayList<>();
                    for (String val : caseValues.values()) {
                        negations.add(generateCondition(parameter, val, "!=", context.getVariableMap()));
                    }
                    condition = String.join(" && ", negations);
                }
            } else if (caseValues.containsKey(handle)) {
                // Specific case
                String val = caseValues.get(handle);
                condition = generateCondition(parameter, val, "==", context.getVariableMap());
            }
            
            drl.append("    ").append("eval(").append(condition).append(")\n");
            
            drl.append("then\n");
            drl.append("    System.out.println(\"Switch ").append(handle).append(" -> ").append(targetId).append("\");\n");
            drl.append("    kcontext.getKnowledgeRuntime().getAgenda().getAgendaGroup(\"")
               .append(getAgendaGroup(targetId)).append("\").setFocus();\n");
            drl.append("end\n\n");
        }
        
        return drl.toString();
    }
    
    private String generateCondition(String parameter, String value, String operator, Map<String, RuleVariable> variableMap) {
        if (parameter == null) return "true";
        
        RuleVariable variable = variableMap.get(parameter);
        String type = variable != null ? variable.getType() : "STRING";
        
        String lhs = "$context.get(\"" + parameter + "\")";
        String rhs = value;
        
        if ("INTEGER".equalsIgnoreCase(type) || "DOUBLE".equalsIgnoreCase(type) || "NUMBER".equalsIgnoreCase(type)) {
            // Fix: 添加空值检查，避免 NullPointerException
            String nullCheck = lhs + " != null";
            String numLhs = "((Number)" + lhs + ").doubleValue()";
            // Ensure rhs is a number
            try {
                Double.parseDouble(rhs);
            } catch (NumberFormatException e) {
                rhs = "0"; // Fallback
            }
            return nullCheck + " && " + numLhs + " " + operator + " " + rhs;
        } else {
            // String comparison
            rhs = "\"" + rhs.replace("\"", "") + "\"";
            if ("==".equals(operator)) {
                return "java.util.Objects.equals(" + lhs + ", " + rhs + ")";
            } else {
                return "!java.util.Objects.equals(" + lhs + ", " + rhs + ")";
            }
        }
    }
}
