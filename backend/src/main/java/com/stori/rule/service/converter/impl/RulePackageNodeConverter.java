package com.stori.rule.service.converter.impl;

import com.stori.rule.dto.NodeDto;
import com.stori.rule.entity.RuleVariable;
import com.stori.rule.service.converter.AbstractNodeConverter;
import com.stori.rule.service.converter.ConverterContext;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class RulePackageNodeConverter extends AbstractNodeConverter {

    @org.springframework.beans.factory.annotation.Autowired
    private com.stori.rule.mapper.RuleVariableMapper ruleVariableMapper;

    @org.springframework.beans.factory.annotation.Autowired
    private com.stori.rule.mapper.RulePackageMapper rulePackageMapper;

    @Override
    public boolean supports(String nodeType) {
        return "RULE_PACKAGE".equalsIgnoreCase(nodeType);
    }

    @Override
    public String convert(NodeDto node, ConverterContext context) {
        StringBuilder drl = new StringBuilder();
        String ruleName = getRuleName(node, context);

        drl.append("rule \"").append(ruleName).append("\"\n");
        drl.append("    agenda-group \"").append(getAgendaGroup(node.getId())).append("\"\n");
        drl.append("when\n");
        drl.append("    $context : Map()\n");
        drl.append("then\n");

        // 1. Prepare Inputs
        Map<String, Object> data = node.getData();
        String packageCode = (String) data.get("packageCode");
        
        if (packageCode != null && !packageCode.isEmpty()) {
            // Fetch sub-package variables for type resolution
            Map<String, String> subPackageVarTypes = new java.util.HashMap<>();
            try {
                Long packageId = null;
                if (data.get("packageId") != null) {
                    packageId = Long.valueOf(data.get("packageId").toString());
                } else {
                    com.stori.rule.entity.RulePackage pkg = rulePackageMapper.selectByCode(packageCode);
                    if (pkg != null) packageId = pkg.getId();
                }

                if (packageId != null) {
                    List<RuleVariable> vars = ruleVariableMapper.selectByPackageId(packageId);
                    for (RuleVariable var : vars) {
                        subPackageVarTypes.put(var.getCode(), var.getType());
                    }
                }
            } catch (Exception e) {
                // Ignore, fallback to default
            }

            drl.append("    // Execute Sub-Package: ").append(packageCode).append("\n");
            drl.append("    java.util.Map subInputs = new java.util.HashMap();\n");

            List<Map<String, Object>> inputMapping = (List<Map<String, Object>>) data.get("inputMapping");
            if (inputMapping != null) {
                for (Map<String, Object> mapping : inputMapping) {
                    String sourceVar = (String) mapping.get("source");
                    String targetVar = (String) mapping.get("target");
                    // Use dynamic type from sub-package if available, else fallback to mapping data or OBJECT
                    String targetType = subPackageVarTypes.getOrDefault(targetVar, (String) mapping.get("targetType"));
                    
                    if (sourceVar != null && targetVar != null) {
                        drl.append("    Object inVal_").append(targetVar).append(" = com.stori.rule.utils.RuleExecutionHelper.extractValue($context, \"").append(sourceVar).append("\");\n");
                        drl.append("    Object inConv_").append(targetVar).append(" = com.stori.rule.utils.RuleExecutionHelper.convert(inVal_").append(targetVar).append(", \"").append(targetType != null ? targetType : "OBJECT").append("\");\n");
                        drl.append("    subInputs.put(\"").append(targetVar).append("\", inConv_").append(targetVar).append(");\n");
                    }
                }
            }

            // 2. Execute
            drl.append("    java.util.Map subOutputs = com.stori.rule.utils.RuleExecutionHelper.execute(\"")
               .append(packageCode).append("\", subInputs);\n");

            // 3. Map Outputs
            List<Map<String, Object>> outputMapping = (List<Map<String, Object>>) data.get("outputMapping");
            if (outputMapping != null) {
                for (Map<String, Object> mapping : outputMapping) {
                    String sourceVar = (String) mapping.get("source");
                    String targetVar = (String) mapping.get("target");
                    // Use current context variable type
                    String targetType = null;
                    if (context.getVariableMap() != null && context.getVariableMap().containsKey(targetVar)) {
                        targetType = context.getVariableMap().get(targetVar).getType();
                    }
                    if (targetType == null) targetType = (String) mapping.get("targetType");
                    
                    if (sourceVar != null && targetVar != null) {
                        drl.append("    if (subOutputs != null) {\n");
                        drl.append("        Object outVal_").append(sourceVar).append(" = com.stori.rule.utils.RuleExecutionHelper.extractValue(subOutputs, \"").append(sourceVar).append("\");\n");
                        drl.append("        Object outConv_").append(sourceVar).append(" = com.stori.rule.utils.RuleExecutionHelper.convert(outVal_").append(sourceVar).append(", \"").append(targetType != null ? targetType : "OBJECT").append("\");\n");
                        drl.append("        com.stori.rule.utils.RuleExecutionHelper.assignValue($context, \"").append(targetVar).append("\", outConv_").append(sourceVar).append(");\n");
                        drl.append("    }\n");
                    }
                }
            }
        }

        List<String> nextNodeIds = getNextNodeIds(node, context);
        if (nextNodeIds != null && !nextNodeIds.isEmpty()) {
            for (String nextNodeId : nextNodeIds) {
                drl.append("    kcontext.getKnowledgeRuntime().getAgenda().getAgendaGroup(\"")
                   .append(getAgendaGroup(nextNodeId)).append("\").setFocus();\n");
            }
        }
        drl.append("end\n\n");
        return drl.toString();
    }
}
