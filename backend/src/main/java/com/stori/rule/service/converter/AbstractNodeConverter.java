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
}
