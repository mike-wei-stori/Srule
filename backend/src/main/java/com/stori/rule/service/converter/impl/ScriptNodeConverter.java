package com.stori.rule.service.converter.impl;

import com.stori.rule.dto.NodeDto;
import com.stori.rule.service.converter.AbstractNodeConverter;
import com.stori.rule.service.converter.ConverterContext;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class ScriptNodeConverter extends AbstractNodeConverter {
    @Override
    public boolean supports(String nodeType) {
        return "SCRIPT".equalsIgnoreCase(nodeType);
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
        
        // Script Logic
        Map<String, Object> data = node.getData();
        String scriptContent = (String) data.get("scriptContent");
        String scriptType = (String) data.getOrDefault("scriptType", "GROOVY");
        
        if (scriptContent != null && !scriptContent.isEmpty()) {
            drl.append("    // Script Start (Type: ").append(scriptType).append(")\n");
            
            if ("JAVASCRIPT".equalsIgnoreCase(scriptType)) {
                // 使用 Java ScriptEngine 执行 JavaScript
                drl.append("    try {\n");
                drl.append("        javax.script.ScriptEngineManager manager = new javax.script.ScriptEngineManager();\n");
                drl.append("        javax.script.ScriptEngine engine = manager.getEngineByName(\"javascript\");\n");
                drl.append("        engine.put(\"context\", $context);\n");
                // 转义脚本内容中的特殊字符
                String escapedScript = escapeJavaString(scriptContent);
                drl.append("        engine.eval(\"").append(escapedScript).append("\");\n");
                drl.append("    } catch (Exception e) {\n");
                drl.append("        System.err.println(\"JavaScript execution error: \" + e.getMessage());\n");
                drl.append("        e.printStackTrace();\n");
                drl.append("    }\n");
            } else {
                // GROOVY 或默认 - 直接嵌入 Java/Drools 代码
                drl.append("    ").append(scriptContent.replace("\n", "\n    ")).append("\n");
            }
            
            drl.append("    // Script End\n");
        } else {
            drl.append("    System.out.println(\"Executing Script Node: ").append(node.getId()).append("\");\n");
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
    
    /**
     * 转义 Java 字符串中的特殊字符
     */
    private String escapeJavaString(String str) {
        if (str == null) return "";
        return str
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t");
    }
}
