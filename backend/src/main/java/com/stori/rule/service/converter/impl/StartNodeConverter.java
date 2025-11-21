package com.stori.rule.service.converter.impl;

import com.stori.rule.dto.NodeDto;
import com.stori.rule.service.converter.AbstractNodeConverter;
import com.stori.rule.service.converter.ConverterContext;
import org.springframework.stereotype.Component;

@Component
public class StartNodeConverter extends AbstractNodeConverter {
    @Override
    public boolean supports(String nodeType) {
        return "START".equalsIgnoreCase(nodeType);
    }

    @Override
    public String convert(NodeDto node, ConverterContext context) {
        StringBuilder drl = new StringBuilder();
        String ruleName = getRuleName(node, context);
        String nextNodeId = getNextNodeId(node, context);
        
        drl.append("rule \"").append(ruleName).append("\"\n");
        drl.append("    agenda-group \"").append(getAgendaGroup(node.getId())).append("\"\n");
        drl.append("    auto-focus true\n");
        drl.append("when\n");
        drl.append("    $context : Map()\n");
        drl.append("then\n");
        drl.append("    System.out.println(\"Executing Start Node: ").append(node.getId()).append("\");\n");
        if (nextNodeId != null) {
            drl.append("    kcontext.getKnowledgeRuntime().getAgenda().getAgendaGroup(\"")
               .append(getAgendaGroup(nextNodeId)).append("\").setFocus();\n");
        }
        drl.append("end\n\n");
        return drl.toString();
    }
}
