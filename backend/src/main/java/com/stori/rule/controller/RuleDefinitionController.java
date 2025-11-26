package com.stori.rule.controller;

import com.alibaba.fastjson.JSON;
import com.stori.rule.common.Result;
import com.stori.rule.dto.GraphDto;
import com.stori.rule.entity.RuleDefinition;
import com.stori.rule.entity.RulePackage;
import com.stori.rule.mapper.RuleDefinitionMapper;
import com.stori.rule.mapper.RulePackageMapper;
import com.stori.rule.service.RuleConverterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/definitions")
public class RuleDefinitionController {

    @Autowired
    private RuleDefinitionMapper ruleDefinitionMapper;

    @Autowired
    private RulePackageMapper rulePackageMapper;

    @Autowired
    private RuleConverterService ruleConverterService;

    @Autowired
    private com.stori.rule.service.DroolsService droolsService;

    @PostMapping("/save/{packageCode}")
    @PreAuthorize("hasAuthority('DEFINITION_SAVE')")
    public Result<RuleDefinition> saveGraph(@PathVariable String packageCode, @RequestBody GraphDto graph) {
        // Find package by code
        RulePackage rulePackage = rulePackageMapper.selectByCode(packageCode);
        
        if (rulePackage == null) {
            return Result.error("Package not found: " + packageCode);
        }
        
        // Convert graph to DRL
        String drl = ruleConverterService.convertToDrl(packageCode, graph);
        
        // Save or update rule definition
        RuleDefinition definition = ruleDefinitionMapper.selectOneByPackageId(rulePackage.getId());
        
        if (definition == null) {
            definition = new RuleDefinition();
            definition.setPackageId(rulePackage.getId());
            definition.setName(packageCode + "_main");
            definition.setPriority(1);
        }
        
        definition.setContentJson(JSON.toJSONString(graph));
        definition.setDrlContent(drl);
        definition.setDescription("Generated from visual editor");
        
        if (definition.getId() == null) {
            ruleDefinitionMapper.insert(definition);
        } else {
            ruleDefinitionMapper.updateById(definition);
        }

        // Reload rules in engine to update cache
        droolsService.reloadRules(packageCode);
        
        return Result.success(definition);
    }

    @GetMapping("/load/{packageCode}")
    @PreAuthorize("hasAuthority('DEFINITION_READ')")
    public Result<GraphDto> loadGraph(@PathVariable String packageCode) {
        // Find package by code
        RulePackage rulePackage = rulePackageMapper.selectByCode(packageCode);
        
        if (rulePackage == null) {
            return Result.error("Package not found: " + packageCode);
        }
        
        // Load rule definition
        RuleDefinition definition = ruleDefinitionMapper.selectOneByPackageId(rulePackage.getId());
        
        if (definition == null || definition.getContentJson() == null) {
            return Result.success(null);
        }
        
        GraphDto graph = JSON.parseObject(definition.getContentJson(), GraphDto.class);
        return Result.success(graph);
    }
}
