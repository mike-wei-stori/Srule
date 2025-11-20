package com.stori.rule.dto;

import lombok.Data;
import java.util.List;

@Data
public class GraphDto {
    private List<NodeDto> nodes;
    private List<EdgeDto> edges;

    public List<NodeDto> getNodes() { return nodes; }
    public void setNodes(List<NodeDto> nodes) { this.nodes = nodes; }

    public List<EdgeDto> getEdges() { return edges; }
    public void setEdges(List<EdgeDto> edges) { this.edges = edges; }
}
