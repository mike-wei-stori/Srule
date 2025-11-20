package com.stori.rule.dto;

import lombok.Data;
import java.util.Map;

@Data
public class EdgeDto {
    private String id;
    private String source;
    private String target;
    private String sourceHandle; // For DECISION nodes: "true" or "false"
    private String label; // Edge label
    private Map<String, Object> data;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getTarget() { return target; }
    public void setTarget(String target) { this.target = target; }

    public String getSourceHandle() { return sourceHandle; }
    public void setSourceHandle(String sourceHandle) { this.sourceHandle = sourceHandle; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public Map<String, Object> getData() { return data; }
    public void setData(Map<String, Object> data) { this.data = data; }
}
