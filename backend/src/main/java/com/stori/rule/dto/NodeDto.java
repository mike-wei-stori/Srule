package com.stori.rule.dto;

import lombok.Data;
import java.util.Map;

@Data
public class NodeDto {
    private String id;
    private String type;
    private Map<String, Object> data;
    private Map<String, Double> position;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Map<String, Object> getData() { return data; }
    public void setData(Map<String, Object> data) { this.data = data; }

    public Map<String, Double> getPosition() { return position; }
    public void setPosition(Map<String, Double> position) { this.position = position; }
}
