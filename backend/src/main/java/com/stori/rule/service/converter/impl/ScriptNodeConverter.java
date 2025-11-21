package com.stori.rule.service.converter.impl;

import com.stori.rule.dto.NodeDto;
import com.stori.rule.service.converter.AbstractNodeConverter;
import com.stori.rule.service.converter.ConverterContext;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ScriptNodeConverter extends AbstractNodeConverter {
    @Override
    public boolean supports(String nodeType) {
        return "SCRIPT".equalsIgnoreCase(nodeType);
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
        
        // Script Logic
        Map<String, Object> data = node.getData();
        String scriptContent = (String) data.get("scriptContent");
        if (scriptContent != null && !scriptContent.isEmpty()) {
            drl.append("    // Script Start\n");
            drl.append("    ").append(scriptContent.replace("\n", "\n    ")).append("\n");
            drl.append("    // Script End\n");
        } else {
            drl.append("    System.out.println(\"Executing Script Node: ").append(node.getId()).append("\");\n");
        }

        if (nextNodeId != null) {
            drl.append("    kcontext.getKnowledgeRuntime().getAgenda().getAgendaGroup(\"")
               .append(getAgendaGroup(nextNodeId)).append("\").setFocus();\n");
        }
        drl.append("end\n\n");
        return drl.toString();
    }
}
