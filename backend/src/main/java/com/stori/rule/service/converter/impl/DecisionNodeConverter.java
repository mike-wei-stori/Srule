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
    
    private String generateCondition(NodeDto node, boolean isTrue, Map<String, RuleVariable> variableMap) {
        Map<String, Object> data = node.getData();
        String logicType = (String) data.getOrDefault("logicType", "CONDITION");
        
        if ("EXPRESSION".equalsIgnoreCase(logicType)) {
            String expression = (String) data.get("expression");
            if (expression != null && !expression.isEmpty()) {
                return isTrue ? "eval(" + expression + ")" : "eval(!(" + expression + "))";
            }
        } else {
            String parameter = (String) data.get("parameter");
            String operator = (String) data.getOrDefault("operator", "==");
            Object value = data.get("value");
            
            if (parameter != null && value != null) {
                if (!isTrue) {
                    operator = invertOperator(operator);
                }
                
                RuleVariable variable = variableMap.get(parameter);
                String type = variable != null ? variable.getType() : "STRING";
                
                if ("INTEGER".equalsIgnoreCase(type) || "DOUBLE".equalsIgnoreCase(type) || "NUMBER".equalsIgnoreCase(type)) {
                    String lhs = "((Number)$context.get(\"" + parameter + "\")).doubleValue()";
                    String rhs = value.toString().replace("\"", "");
                    return "eval(" + lhs + " " + operator + " " + rhs + ")";
                } else {
                    String key = parameter;
                    String val = "\"" + value.toString().replace("\"", "") + "\"";
                    
                    if ("==".equals(operator)) {
                        return "eval(java.util.Objects.equals($context.get(\"" + key + "\"), " + val + "))";
                    } else if ("!=".equals(operator)) {
                        return "eval(!java.util.Objects.equals($context.get(\"" + key + "\"), " + val + "))";
                    } else {
                        String compOp = "";
                        switch (operator) {
                            case ">": compOp = "> 0"; break;
                            case ">=": compOp = ">= 0"; break;
                            case "<": compOp = "< 0"; break;
                            case "<=": compOp = "<= 0"; break;
                        }
                        if (!compOp.isEmpty()) {
                            return "eval($context.get(\"" + key + "\") != null && ((String)$context.get(\"" + key + "\")).compareTo(" + val + ") " + compOp + ")";
                        }
                    }
                }
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
            default: return operator;
        }
    }
}
