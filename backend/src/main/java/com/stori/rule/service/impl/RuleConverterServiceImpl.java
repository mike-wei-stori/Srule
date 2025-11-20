package com.stori.rule.service.impl;

import com.stori.rule.dto.EdgeDto;
import com.stori.rule.dto.GraphDto;
import com.stori.rule.dto.NodeDto;
import com.stori.rule.entity.RulePackage;
import com.stori.rule.entity.RuleVariable;
import com.stori.rule.mapper.RulePackageMapper;
import com.stori.rule.mapper.RuleVariableMapper;
import com.stori.rule.service.RuleConverterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RuleConverterServiceImpl implements RuleConverterService {

    @Autowired
    private RulePackageMapper rulePackageMapper;

    @Autowired
    private RuleVariableMapper ruleVariableMapper;

    // Helper class to track path with edge metadata
    private static class PathStep {
        NodeDto node;
        String edgeLabel; // "true", "false", "loopBody", "afterLoop", etc.
        
        PathStep(NodeDto node, String edgeLabel) {
            this.node = node;
            this.edgeLabel = edgeLabel;
        }
    }

    @Override
    public String convertToDrl(String packageCode, GraphDto graph) {
        // Fetch package and variables
        RulePackage rulePackage = rulePackageMapper.selectByCode(packageCode);
        if (rulePackage == null) {
            throw new RuntimeException("Package not found: " + packageCode);
        }
        
        List<RuleVariable> variables = ruleVariableMapper.selectByPackageId(rulePackage.getId());
        Map<String, RuleVariable> variableMap = variables.stream().collect(Collectors.toMap(RuleVariable::getCode, v -> v));

        StringBuilder drl = new StringBuilder();
        
        // DRL package and imports
        drl.append("package ").append(packageCode).append(";\n\n");
        drl.append("import java.util.Map;\n");
        drl.append("import java.util.HashMap;\n");
        drl.append("import java.util.List;\n\n");
        
        // Build edge map with metadata
        Map<String, List<EdgeDto>> edgeMap = buildEdgeMap(graph.getEdges());
        Map<String, NodeDto> nodeMap = graph.getNodes().stream()
            .collect(Collectors.toMap(NodeDto::getId, n -> n));
        
        // Find start node
        NodeDto startNode = graph.getNodes().stream()
            .filter(n -> "START".equalsIgnoreCase(getNodeType(n)))
            .findFirst()
            .orElse(null);
        
        if (startNode == null) {
            throw new RuntimeException("No START node found in graph");
        }
        
        // Calculate Node Levels for Auto-Grouping
        Map<String, Integer> nodeLevels = calculateNodeLevels(startNode, edgeMap, nodeMap);
        int maxLevel = nodeLevels.values().stream().mapToInt(Integer::intValue).max().orElse(0);

        // Generate rules by traversing paths
        List<List<PathStep>> paths = findAllPaths(startNode, edgeMap, nodeMap);
        
        // Generate Boot Rule for Auto-Calculated Agenda Group Stack
        String bootRule = generateAutoBootRule(packageCode, maxLevel);
        drl.append(bootRule).append("\n\n");
        
        int ruleIndex = 1;
        for (List<PathStep> path : paths) {
            String rule = generateRuleFromPath(packageCode, ruleIndex++, path, variableMap, nodeLevels);
            drl.append(rule).append("\n\n");
        }
        
        return drl.toString();
    }

    // Helper to calculate node levels using BFS
    private Map<String, Integer> calculateNodeLevels(NodeDto startNode, Map<String, List<EdgeDto>> edgeMap, Map<String, NodeDto> nodeMap) {
        Map<String, Integer> levels = new HashMap<>();
        Queue<String> queue = new LinkedList<>();
        
        queue.add(startNode.getId());
        levels.put(startNode.getId(), 0);
        
        while (!queue.isEmpty()) {
            String currentId = queue.poll();
            int currentLevel = levels.get(currentId);
            
            List<EdgeDto> outgoing = edgeMap.get(currentId);
            if (outgoing != null) {
                for (EdgeDto edge : outgoing) {
                    String targetId = edge.getTarget();
                    // Only visit if not visited (BFS ensures shortest path level, which is good for flow)
                    // For loops, we don't want to re-process or get stuck.
                    if (!levels.containsKey(targetId)) {
                        levels.put(targetId, currentLevel + 1);
                        queue.add(targetId);
                    }
                }
            }
        }
        return levels;
    }
    
    private String generateAutoBootRule(String packageCode, int maxLevel) {
        StringBuilder rule = new StringBuilder();
        rule.append("rule \"").append(packageCode).append("_BOOT_RULE\"\n");
        rule.append("    salience 10000\n"); // High priority
        rule.append("when\n");
        rule.append("    $context : Map()\n"); // Always fire if context exists
        rule.append("then\n");
        
        // Set focus in REVERSE order (Max -> 0) to build stack [0, 1, 2, ... Max] (Top is 0)
        // So Level 0 executes first.
        for (int i = maxLevel; i >= 0; i--) {
            rule.append("    kcontext.getKnowledgeRuntime().getAgenda().getAgendaGroup(\"GROUP_LEVEL_").append(i).append("\").setFocus();\n");
        }
        
        rule.append("    System.out.println(\"Boot Rule: Auto-Agenda Groups initialized (Levels 0 to ").append(maxLevel).append(")\");\n");
        rule.append("end");
        return rule.toString();
    }
    
    private Map<String, List<EdgeDto>> buildEdgeMap(List<EdgeDto> edges) {
        Map<String, List<EdgeDto>> edgeMap = new HashMap<>();
        for (EdgeDto edge : edges) {
            edgeMap.computeIfAbsent(edge.getSource(), k -> new ArrayList<>()).add(edge);
        }
        return edgeMap;
    }
    
    private List<List<PathStep>> findAllPaths(NodeDto startNode, 
                                               Map<String, List<EdgeDto>> edgeMap,
                                               Map<String, NodeDto> nodeMap) {
        List<List<PathStep>> allPaths = new ArrayList<>();
        List<PathStep> currentPath = new ArrayList<>();
        Set<String> visited = new HashSet<>();
        
        dfs(startNode, null, edgeMap, nodeMap, currentPath, visited, allPaths);
        
        return allPaths;
    }
    
    private void dfs(NodeDto node,
                     String edgeLabel,
                     Map<String, List<EdgeDto>> edgeMap,
                     Map<String, NodeDto> nodeMap,
                     List<PathStep> currentPath,
                     Set<String> visited,
                     List<List<PathStep>> allPaths) {
        
        currentPath.add(new PathStep(node, edgeLabel));
        visited.add(node.getId());
        
        String nodeType = getNodeType(node);
        
        // If it's an ACTION node, we found a valid rule path. Save it.
        // BUT do NOT stop traversal. There might be more nodes after this action.
        if ("ACTION".equalsIgnoreCase(nodeType)) {
             allPaths.add(new ArrayList<>(currentPath));
        }
        
        List<EdgeDto> outgoingEdges = edgeMap.get(node.getId());
        
        if (outgoingEdges != null && !outgoingEdges.isEmpty()) {
            for (EdgeDto edge : outgoingEdges) {
                if (!visited.contains(edge.getTarget())) {
                    NodeDto neighbor = nodeMap.get(edge.getTarget());
                    if (neighbor != null) {
                        // Pass edge label (sourceHandle or label)
                        String label = edge.getSourceHandle() != null ? edge.getSourceHandle() : edge.getLabel();
                        dfs(neighbor, label, edgeMap, nodeMap, currentPath, visited, allPaths);
                    }
                }
            }
        }
        
        currentPath.remove(currentPath.size() - 1);
        visited.remove(node.getId());
    }
    
    private boolean hasActionNode(List<PathStep> path) {
        return path.stream().anyMatch(step -> "ACTION".equalsIgnoreCase(getNodeType(step.node)));
    }
    
    private String generateRuleFromPath(String packageCode, int ruleIndex, List<PathStep> path, Map<String, RuleVariable> variableMap, Map<String, Integer> nodeLevels) {
        StringBuilder rule = new StringBuilder();
        
        // Auto-Assign Agenda Group based on the Level of the ACTION node (last node in path)
        NodeDto lastNode = path.get(path.size() - 1).node;
        
        String ruleName;
        String nodeLabel = (String) lastNode.getData().get("label");
        if (nodeLabel != null && !nodeLabel.trim().isEmpty()) {
            // Sanitize label to be a valid DRL string (escape quotes)
            ruleName = nodeLabel.replace("\"", "\\\"").replace("\n", " ");
        } else {
            ruleName = packageCode + "_rule_" + ruleIndex;
        }
        
        rule.append("rule \"").append(ruleName).append("\"\n");
        Integer level = nodeLevels.getOrDefault(lastNode.getId(), 0);
        rule.append("    agenda-group \"GROUP_LEVEL_").append(level).append("\"\n");
        
        rule.append("when\n");
        
        // Generate LHS (conditions)
        // Always bind context once
        rule.append("    $context : Map()\n");
        
        boolean hasConditions = false;
        for (int i = 0; i < path.size(); i++) {
            PathStep step = path.get(i);
            String nodeType = getNodeType(step.node);
            if ("DECISION".equalsIgnoreCase(nodeType)) {
                // For DECISION nodes, we need the OUTGOING edge label (to the next node)
                String outgoingEdgeLabel = null;
                if (i + 1 < path.size()) {
                    // Get the edge label of the NEXT step (which is the outgoing edge from this DECISION)
                    outgoingEdgeLabel = path.get(i + 1).edgeLabel;
                }
                
                String condition = generateDecisionCondition(step.node, outgoingEdgeLabel, variableMap);
                if (condition != null && !condition.isEmpty()) {
                    rule.append("    ").append(condition).append("\n");
                    hasConditions = true;
                }
            }
        }
        
        rule.append("then\n");
        
        // Generate RHS (actions) - ONLY for the LAST node in the path
        for (int i = 0; i < path.size(); i++) {
            PathStep step = path.get(i);
            boolean isLastNode = (i == path.size() - 1);
            String nodeType = getNodeType(step.node);
            
            if ("ACTION".equalsIgnoreCase(nodeType)) {
                if (isLastNode) {
                    String action = generateAction(step.node, variableMap);
                    rule.append("    ").append(action).append("\n");
                }
            } else if ("SCRIPT".equalsIgnoreCase(nodeType)) {
                String script = generateScript(step.node);
                rule.append("    ").append(script).append("\n");
            } else if ("LOOP".equalsIgnoreCase(nodeType)) {
                String loop = generateLoop(step.node, step.edgeLabel, variableMap);
                rule.append("    ").append(loop).append("\n");
            }
        }
        
        rule.append("end");
        
        return rule.toString();
    }
    
    private String generateDecisionCondition(NodeDto node, String edgeLabel, Map<String, RuleVariable> variableMap) {
        Map<String, Object> data = node.getData();
        String logicType = (String) data.getOrDefault("logicType", "CONDITION");
        
        if ("EXPRESSION".equalsIgnoreCase(logicType)) {
            // Use custom expression
            String expression = (String) data.get("expression");
            if (expression != null && !expression.isEmpty()) {
                if ("false".equalsIgnoreCase(edgeLabel)) {
                    return "eval(!(" + expression + "))";
                } else {
                    return "eval(" + expression + ")";
                }
            }
        } else {
            // CONDITION mode: use parameter, operator, value
            String parameter = (String) data.get("parameter");
            String operator = (String) data.getOrDefault("operator", "==");
            Object value = data.get("value");
            
            if (parameter != null && value != null) {
                // Invert operator for "false" branch
                if (edgeLabel != null && "false".equalsIgnoreCase(edgeLabel.trim())) {
                    operator = invertOperator(operator);
                }
                
                RuleVariable variable = variableMap.get(parameter);
                String type = variable != null ? variable.getType() : "STRING"; // Default to String
                
                // Handle Numeric Types
                if ("INTEGER".equalsIgnoreCase(type) || "DOUBLE".equalsIgnoreCase(type) || "NUMBER".equalsIgnoreCase(type)) {
                    // Cast LHS to Double for safe comparison (covers int and double)
                    // Note: If variable is Integer, (Double) might fail if it's not automatically promoted.
                    // Safer: ((Number)$context.get("param")).doubleValue()
                    String lhs = "((Number)$context.get(\"" + parameter + "\")).doubleValue()";
                    String rhs = value.toString(); // Assuming value is a number string like "0" or "2"
                    
                    // Ensure RHS is a valid number string (remove quotes if any)
                    rhs = rhs.replace("\"", "");
                    
                    return "eval(" + lhs + " " + operator + " " + rhs + ")";
                } 
                // Handle String Types
                else {
                    String key = parameter;
                    String val = "\"" + value.toString().replace("\"", "") + "\""; // Ensure quotes
                    
                    if ("==".equals(operator)) {
                        return "eval(java.util.Objects.equals($context.get(\"" + key + "\"), " + val + "))";
                    } else if ("!=".equals(operator)) {
                        return "eval(!java.util.Objects.equals($context.get(\"" + key + "\"), " + val + "))";
                    } else {
                        // For > < >= <= on Strings, use compareTo with null check and cast
                        String compOp = "";
                        switch (operator) {
                            case ">": compOp = "> 0"; break;
                            case ">=": compOp = ">= 0"; break;
                            case "<": compOp = "< 0"; break;
                            case "<=": compOp = "<= 0"; break;
                        }
                        
                        if (!compOp.isEmpty()) {
                            // Check null before casting
                            return "eval($context.get(\"" + key + "\") != null && ((String)$context.get(\"" + key + "\")).compareTo(" + val + ") " + compOp + ")";
                        }
                    }
                }
            }
        }
        
        return ""; 
    }
    
    private String invertOperator(String operator) {
        switch (operator) {
            case "==": return "!=";
            case "!=": return "==";
            case ">": return "<=";
            case ">=": return "<";
            case "<": return ">=";
            case "<=": return ">";
            default: return operator;
        }
    }
    
    private String generateAction(NodeDto node, Map<String, RuleVariable> variableMap) {
        Map<String, Object> data = node.getData();
        String targetParameter = (String) data.get("targetParameter");
        if (targetParameter != null) {
            Object assignmentValue = data.get("assignmentValue");
            String valueStr = formatValue(targetParameter, assignmentValue, variableMap);
            
            return "$context.put(\"" + targetParameter + "\", " + valueStr + ");";
        }
        
        return "System.out.println(\"Action executed\");";
    }
    
    private String generateScript(NodeDto node) {
        Map<String, Object> data = node.getData();
        String scriptContent = (String) data.get("scriptContent");
        if (scriptContent != null && !scriptContent.isEmpty()) {
            return "// Script execution\n    " + scriptContent.replace("\n", "\n    ");
        }
        return "// Empty script";
    }
    
    private String generateLoop(NodeDto node, String edgeLabel, Map<String, RuleVariable> variableMap) {
        Map<String, Object> data = node.getData();
        String collectionVariable = (String) data.get("collectionVariable");
        
        if (collectionVariable != null && "loopBody".equalsIgnoreCase(edgeLabel)) {
            return "// Loop over " + collectionVariable + "\n" +
                   "    List $items = (List) $context.get(\"" + collectionVariable + "\");\n" +
                   "    if ($items != null) {\n" +
                   "        for (Object $item : $items) {\n" +
                   "            // Process item\n" +
                   "            System.out.println(\"Processing: \" + $item);\n" +
                   "        }\n" +
                   "    }";
        } else if ("afterLoop".equalsIgnoreCase(edgeLabel)) {
            return "// After loop logic\n    System.out.println(\"Loop completed\");";
        }
        
        return "// Loop node";
    }
    
    private String formatValue(String parameterCode, Object value, Map<String, RuleVariable> variableMap) {
        if (value == null) return "null";
        
        RuleVariable variable = variableMap.get(parameterCode);
        if (variable == null) {
            // Try to infer type
            if (value instanceof String) {
                return "\"" + value + "\"";
            }
            return value.toString();
        }
        
        String type = variable.getType();
        if ("STRING".equalsIgnoreCase(type) || "DATE".equalsIgnoreCase(type)) {
            return "\"" + value + "\"";
        }
        
        return value.toString();
    }
    
    private String getNodeType(NodeDto node) {
        Object type = node.getData().get("type");
        return type != null ? type.toString() : node.getType();
    }
}
