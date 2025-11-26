package com.stori.rule.dto;

import com.stori.rule.entity.Feature;
import com.stori.rule.entity.RuleDefinition;
import com.stori.rule.entity.RuleVariable;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class PackageSnapshot {
    private List<RuleDefinition> ruleDefinitions;
    private List<RuleVariable> variables;
    private Map<Long, Feature> featureMap;
    private Long timestamp;
}

