package com.stori.rule.service.converter.impl;

import com.stori.rule.dto.EdgeDto;
import com.stori.rule.dto.NodeDto;
import com.stori.rule.service.converter.AbstractNodeConverter;
import com.stori.rule.service.converter.ConverterContext;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class LoopNodeConverter extends AbstractNodeConverter {
    @Override
    public boolean supports(String nodeType) {
        return "LOOP".equalsIgnoreCase(nodeType);
    }

    @Override
    public String convert(NodeDto node, ConverterContext context) {
        StringBuilder drl = new StringBuilder();
        List<EdgeDto> edges = context.getOutgoingEdges(node.getId());
        
        // This is a simplified Loop implementation that just follows the flow.
        // Real looping in Drools agenda-group requires managing state (Iterator) in working memory.
        // For now, we will just transition to "loopBody" if present, or "afterLoop".
        
        for (EdgeDto edge : edges) {
            String targetId = edge.getTarget();
            String label = edge.getSourceHandle() != null ? edge.getSourceHandle() : edge.getLabel();
            
            String ruleName = getRuleName(node, context) + "_" + label + "_" + targetId;
            
            drl.append("rule \"").append(ruleName).append("\"\n");
            drl.append("    agenda-group \"").append(getAgendaGroup(node.getId())).append("\"\n");
            drl.append("when\n");
            drl.append("    $context : Map()\n");
            // In a real loop, we would check if there are items left.
            drl.append("then\n");
            drl.append("    System.out.println(\"Loop Transition: ").append(label).append("\");\n");
            drl.append("    kcontext.getKnowledgeRuntime().getAgenda().getAgendaGroup(\"")
               .append(getAgendaGroup(targetId)).append("\").setFocus();\n");
            drl.append("end\n\n");
        }
        return drl.toString();
    }
}
