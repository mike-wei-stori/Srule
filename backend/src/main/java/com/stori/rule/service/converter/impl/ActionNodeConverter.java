package com.stori.rule.service.converter.impl;

import com.stori.rule.dto.NodeDto;
import com.stori.rule.service.converter.AbstractNodeConverter;
import com.stori.rule.service.converter.ConverterContext;
import org.springframework.stereotype.Component;

import java.util.Map;

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
        String nextNodeId = getNextNodeId(node, context);
        
        drl.append("rule \"").append(ruleName).append("\"\n");
        drl.append("    agenda-group \"").append(getAgendaGroup(node.getId())).append("\"\n");
        drl.append("when\n");
        drl.append("    $context : Map()\n");
        drl.append("then\n");
        
        // Action Logic
        Map<String, Object> data = node.getData();
        String targetParameter = (String) data.get("targetParameter");
        if (targetParameter != null) {
            Object assignmentValue = data.get("assignmentValue");
            String valueStr = formatValue(targetParameter, assignmentValue, context.getVariableMap());
            drl.append("    $context.put(\"").append(targetParameter).append("\", ").append(valueStr).append(");\n");
            drl.append("    System.out.println(\"Action: Set ").append(targetParameter).append(" = \" + ").append(valueStr).append(");\n");
        } else {
            drl.append("    System.out.println(\"Executing Action Node: ").append(node.getId()).append("\");\n");
        }

        if (nextNodeId != null) {
            drl.append("    kcontext.getKnowledgeRuntime().getAgenda().getAgendaGroup(\"")
               .append(getAgendaGroup(nextNodeId)).append("\").setFocus();\n");
        }
        drl.append("end\n\n");
        return drl.toString();
    }
}
