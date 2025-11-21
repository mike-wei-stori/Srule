package com.stori.rule.service.impl;

import com.stori.rule.dto.GraphDto;
import com.stori.rule.dto.NodeDto;
import com.stori.rule.entity.RulePackage;
import com.stori.rule.entity.RuleVariable;
import com.stori.rule.mapper.RulePackageMapper;
import com.stori.rule.mapper.RuleVariableMapper;
import com.stori.rule.service.RuleConverterService;
import com.stori.rule.service.converter.ConverterContext;
import com.stori.rule.service.converter.NodeConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
public class RuleConverterServiceImpl implements RuleConverterService {

    @Autowired
    private RulePackageMapper rulePackageMapper;

    @Autowired
    private RuleVariableMapper ruleVariableMapper;
    
    @Autowired
    private List<NodeConverter> nodeConverters;

    @Override
    public String convertToDrl(String packageCode, GraphDto graph) {
        RulePackage rulePackage = rulePackageMapper.selectByCode(packageCode);
        if (rulePackage == null) {
            throw new RuntimeException("Package not found: " + packageCode);
        }
        
        List<RuleVariable> variables = ruleVariableMapper.selectByPackageId(rulePackage.getId());
        ConverterContext context = new ConverterContext(packageCode, graph, variables);
        
        StringBuilder drl = new StringBuilder();
        drl.append("package ").append(packageCode).append(";\n\n");
        drl.append("import java.util.Map;\n");
        drl.append("import java.util.HashMap;\n");
        drl.append("import java.util.List;\n\n");
        
        // Sort nodes to ensure deterministic output order in the file
        // (Execution order is determined by agenda-groups)
        graph.getNodes().sort(Comparator.comparing(NodeDto::getId));
        
        for (NodeDto node : graph.getNodes()) {
            String nodeType = getNodeType(node);
            NodeConverter converter = findConverter(nodeType);
            
            if (converter != null) {
                drl.append(converter.convert(node, context));
            } else {
                drl.append("// Unsupported node type: ").append(nodeType).append(" (ID: ").append(node.getId()).append(")\n\n");
            }
        }
        
        return drl.toString();
    }
    
    private NodeConverter findConverter(String nodeType) {
        return nodeConverters.stream()
                .filter(c -> c.supports(nodeType))
                .findFirst()
                .orElse(null);
    }
    
    private String getNodeType(NodeDto node) {
        Map<String, Object> data = node.getData();
        if (data != null && data.get("type") != null) {
            return data.get("type").toString();
        }
        return node.getType();
    }
}
