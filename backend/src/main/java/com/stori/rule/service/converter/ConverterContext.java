package com.stori.rule.service.converter;

import com.stori.rule.dto.EdgeDto;
import com.stori.rule.dto.GraphDto;
import com.stori.rule.dto.NodeDto;
import com.stori.rule.entity.RuleVariable;
import lombok.Data;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Data
public class ConverterContext {
    private String packageCode;
    private GraphDto graph;
    private Map<String, RuleVariable> variableMap;
    private Map<String, List<EdgeDto>> edgeMap;
    private Map<String, NodeDto> nodeMap;

    public ConverterContext(String packageCode, GraphDto graph, List<RuleVariable> variables) {
        this.packageCode = packageCode;
        this.graph = graph;
        this.variableMap = variables.stream().collect(Collectors.toMap(RuleVariable::getCode, v -> v));
        this.nodeMap = graph.getNodes().stream().collect(Collectors.toMap(NodeDto::getId, Function.identity()));
        this.edgeMap = new HashMap<>();
        for (EdgeDto edge : graph.getEdges()) {
            this.edgeMap.computeIfAbsent(edge.getSource(), k -> new ArrayList<>()).add(edge);
        }
    }
    
    public NodeDto getNode(String id) {
        return nodeMap.get(id);
    }
    
    public List<EdgeDto> getOutgoingEdges(String nodeId) {
        return edgeMap.getOrDefault(nodeId, new ArrayList<>());
    }
}
