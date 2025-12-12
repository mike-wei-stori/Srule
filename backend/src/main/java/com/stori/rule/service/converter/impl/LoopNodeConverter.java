package com.stori.rule.service.converter.impl;

import com.stori.rule.dto.EdgeDto;
import com.stori.rule.dto.NodeDto;
import com.stori.rule.entity.RuleVariable;
import com.stori.rule.service.converter.AbstractNodeConverter;
import com.stori.rule.service.converter.ConverterContext;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class LoopNodeConverter extends AbstractNodeConverter {
    @Override
    public boolean supports(String nodeType) {
        return "LOOP".equalsIgnoreCase(nodeType);
    }

    @Override
    public String convert(NodeDto node, ConverterContext context) {
        StringBuilder drl = new StringBuilder();
        List<EdgeDto> edges = context.getOutgoingEdges(node.getId());
        Map<String, Object> data = node.getData();
        
        // 获取循环配置
        String loopType = (String) data.getOrDefault("loopType", "COUNT"); // COUNT, COLLECTION, WHILE
        String loopVariable = (String) data.get("loopVariable"); // 循环计数器/迭代器变量
        String collectionVariable = (String) data.get("collectionVariable"); // 要遍历的集合变量
        String itemVariable = (String) data.get("itemVariable"); // 当前项变量
        Object maxIterations = data.getOrDefault("maxIterations", 10); // 最大迭代次数
        String whileCondition = (String) data.get("whileCondition"); // WHILE条件
        
        String loopIndexKey = "_loop_index_" + node.getId();
        String loopInitKey = "_loop_init_" + node.getId();
        
        // 找到 loopBody 和 afterLoop 的目标节点
        String loopBodyTarget = null;
        String afterLoopTarget = null;
        
        for (EdgeDto edge : edges) {
            String handle = edge.getSourceHandle() != null ? edge.getSourceHandle() : edge.getLabel();
            if ("loopBody".equals(handle) || "body".equals(handle)) {
                loopBodyTarget = edge.getTarget();
            } else if ("afterLoop".equals(handle) || "exit".equals(handle) || "done".equals(handle)) {
                afterLoopTarget = edge.getTarget();
            }
        }
        
        // 如果没有明确的分支，使用默认的边
        if (loopBodyTarget == null && !edges.isEmpty()) {
            loopBodyTarget = edges.get(0).getTarget();
        }
        
        String ruleName = getRuleName(node, context);
        
        // 规则1: 循环初始化
        drl.append("rule \"").append(ruleName).append("_init\"\n");
        drl.append("    agenda-group \"").append(getAgendaGroup(node.getId())).append("\"\n");
        drl.append("    salience 100\n"); // 高优先级，确保先初始化
        drl.append("when\n");
        drl.append("    $context : Map()\n");
        drl.append("    eval($context.get(\"").append(loopInitKey).append("\") == null)\n");
        drl.append("then\n");
        drl.append("    System.out.println(\"Loop Init: ").append(node.getId()).append("\");\n");
        drl.append("    $context.put(\"").append(loopIndexKey).append("\", 0);\n");
        drl.append("    $context.put(\"").append(loopInitKey).append("\", true);\n");
        
        if ("COLLECTION".equals(loopType) && collectionVariable != null) {
            // 对于集合遍历，初始化迭代器
            drl.append("    java.util.List _list = (java.util.List) $context.get(\"").append(collectionVariable).append("\");\n");
            drl.append("    $context.put(\"_loop_size_").append(node.getId()).append("\", _list != null ? _list.size() : 0);\n");
        }
        
        drl.append("    update($context);\n");
        drl.append("end\n\n");
        
        // 规则2: 循环条件检查 - 继续循环
        if (loopBodyTarget != null) {
            drl.append("rule \"").append(ruleName).append("_continue\"\n");
            drl.append("    agenda-group \"").append(getAgendaGroup(node.getId())).append("\"\n");
            drl.append("    salience 50\n");
            drl.append("when\n");
            drl.append("    $context : Map()\n");
            drl.append("    eval($context.get(\"").append(loopInitKey).append("\") != null)\n");
            
            // 根据循环类型生成不同的条件
            if ("COLLECTION".equals(loopType)) {
                drl.append("    eval(((Integer)$context.get(\"").append(loopIndexKey).append("\")) < ((Integer)$context.getOrDefault(\"_loop_size_").append(node.getId()).append("\", 0)))\n");
            } else if ("WHILE".equals(loopType) && whileCondition != null && !whileCondition.isEmpty()) {
                drl.append("    eval(").append(whileCondition).append(")\n");
            } else {
                // COUNT 类型
                drl.append("    eval(((Integer)$context.get(\"").append(loopIndexKey).append("\")) < ").append(maxIterations).append(")\n");
            }
            
            drl.append("then\n");
            drl.append("    int idx = (Integer) $context.get(\"").append(loopIndexKey).append("\");\n");
            drl.append("    System.out.println(\"Loop iteration: \" + idx);\n");
            
            // 如果是集合遍历，设置当前项
            if ("COLLECTION".equals(loopType) && collectionVariable != null && itemVariable != null) {
                drl.append("    java.util.List _list = (java.util.List) $context.get(\"").append(collectionVariable).append("\");\n");
                drl.append("    if (_list != null && idx < _list.size()) {\n");
                drl.append("        $context.put(\"").append(itemVariable).append("\", _list.get(idx));\n");
                drl.append("    }\n");
            }
            
            // 如果配置了循环变量，将索引放入该变量
            if (loopVariable != null && !loopVariable.isEmpty()) {
                drl.append("    $context.put(\"").append(loopVariable).append("\", idx);\n");
            }
            
            // 递增循环计数器
            drl.append("    $context.put(\"").append(loopIndexKey).append("\", idx + 1);\n");
            drl.append("    update($context);\n");
            drl.append("    kcontext.getKnowledgeRuntime().getAgenda().getAgendaGroup(\"")
               .append(getAgendaGroup(loopBodyTarget)).append("\").setFocus();\n");
            drl.append("end\n\n");
        }
        
        // 规则3: 循环结束条件 - 退出循环
        if (afterLoopTarget != null) {
            drl.append("rule \"").append(ruleName).append("_exit\"\n");
            drl.append("    agenda-group \"").append(getAgendaGroup(node.getId())).append("\"\n");
            drl.append("    salience 10\n"); // 低于 continue 的优先级
            drl.append("when\n");
            drl.append("    $context : Map()\n");
            drl.append("    eval($context.get(\"").append(loopInitKey).append("\") != null)\n");
            
            // 根据循环类型生成退出条件
            if ("COLLECTION".equals(loopType)) {
                drl.append("    eval(((Integer)$context.get(\"").append(loopIndexKey).append("\")) >= ((Integer)$context.getOrDefault(\"_loop_size_").append(node.getId()).append("\", 0)))\n");
            } else if ("WHILE".equals(loopType) && whileCondition != null && !whileCondition.isEmpty()) {
                drl.append("    eval(!(").append(whileCondition).append("))\n");
            } else {
                // COUNT 类型
                drl.append("    eval(((Integer)$context.get(\"").append(loopIndexKey).append("\")) >= ").append(maxIterations).append(")\n");
            }
            
            drl.append("then\n");
            drl.append("    System.out.println(\"Loop Exit: ").append(node.getId()).append("\");\n");
            // 清理循环状态
            drl.append("    $context.remove(\"").append(loopIndexKey).append("\");\n");
            drl.append("    $context.remove(\"").append(loopInitKey).append("\");\n");
            drl.append("    $context.remove(\"_loop_size_").append(node.getId()).append("\");\n");
            drl.append("    update($context);\n");
            drl.append("    kcontext.getKnowledgeRuntime().getAgenda().getAgendaGroup(\"")
               .append(getAgendaGroup(afterLoopTarget)).append("\").setFocus();\n");
            drl.append("end\n\n");
        }
        
        return drl.toString();
    }
}
