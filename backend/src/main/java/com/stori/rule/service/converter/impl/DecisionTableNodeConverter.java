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

        // Fix: 收集所有分支条件，用于生成 default 分支
        List<String> allConditions = new ArrayList<>();
        EdgeDto defaultEdge = null;

        for (EdgeDto edge : edges) {
            String targetId = edge.getTarget();
            String handle = edge.getSourceHandle();
            
            // Fix: 处理 default 分支
            if ("default".equals(handle)) {
                defaultEdge = edge;
                continue;
            }
            
            if (!branchMap.containsKey(handle)) continue;
            
            Map<String, Object> branch = branchMap.get(handle);
            String ruleName = getRuleName(node, context) + "_" + handle + "_" + targetId;
            
            String condition = generateCondition(branch, context.getVariableMap());
            allConditions.add(condition);
            
            drl.append("rule \"").append(ruleName).append("\"\n");
            drl.append("    agenda-group \"").append(getAgendaGroup(node.getId())).append("\"\n");
            drl.append("when\n");
            drl.append("    $context : Map()\n");
            drl.append("    ").append("eval(").append(condition).append(")\n");
            
            drl.append("then\n");
            drl.append("    System.out.println(\"DecisionTable ").append(handle).append(" -> ").append(targetId).append("\");\n");
            drl.append("    kcontext.getKnowledgeRuntime().getAgenda().getAgendaGroup(\"")
               .append(getAgendaGroup(targetId)).append("\").setFocus();\n");
            drl.append("end\n\n");
        }
        
        // Fix: 生成 default 分支规则（当所有其他条件都不满足时）
        if (defaultEdge != null) {
            String targetId = defaultEdge.getTarget();
            String ruleName = getRuleName(node, context) + "_default_" + targetId;
            
            drl.append("rule \"").append(ruleName).append("\"\n");
            drl.append("    agenda-group \"").append(getAgendaGroup(node.getId())).append("\"\n");
            drl.append("    salience -1\n"); // 低优先级，确保其他分支先匹配
            drl.append("when\n");
            drl.append("    $context : Map()\n");
            
            // 生成否定所有其他条件的表达式
            if (!allConditions.isEmpty()) {
                String negatedConditions = allConditions.stream()
                    .map(c -> "!(" + c + ")")
                    .collect(Collectors.joining(" && "));
                drl.append("    eval(").append(negatedConditions).append(")\n");
            } else {
                drl.append("    eval(true)\n");
            }
            
            drl.append("then\n");
            drl.append("    System.out.println(\"DecisionTable default -> ").append(targetId).append("\");\n");
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
            
            return generateConditionDrl(parameter, operator, value, variableMap);
        }
    }
}
