package com.stori.rule.controller;

import com.alibaba.fastjson.JSON;
import org.springframework.security.access.prepost.PreAuthorize;
import com.stori.rule.common.Result;
import com.stori.rule.dto.GraphDto;
import com.stori.rule.entity.RuleDefinition;
import com.stori.rule.entity.RulePackage;
import com.stori.rule.mapper.RuleDefinitionMapper;
import com.stori.rule.service.RuleConverterService;
import com.stori.rule.service.RulePackageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/packages")
public class RulePackageController {

    @Autowired
    private RulePackageService rulePackageService;

    @Autowired
    private RuleDefinitionMapper ruleDefinitionMapper;

    @Autowired
    private RuleConverterService ruleConverterService;

    @Autowired
    private com.stori.rule.service.RulePackageVersionService versionService;

    @GetMapping
    @PreAuthorize("hasAuthority('PACKAGE_READ')")
    public Result<List<RulePackage>> list() {
        return Result.success(rulePackageService.list());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PACKAGE_READ')")
    public Result<RulePackage> getById(@PathVariable Long id) {
        return Result.success(rulePackageService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PACKAGE_CREATE')")
    public Result<Boolean> create(@RequestBody RulePackage rulePackage) {
        return Result.success(rulePackageService.save(rulePackage));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PACKAGE_UPDATE')")
    public Result<Boolean> update(@PathVariable Long id, @RequestBody RulePackage rulePackage) {
        rulePackage.setId(id);
        return Result.success(rulePackageService.updateById(rulePackage));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PACKAGE_DELETE')")
    public Result<Boolean> delete(@PathVariable Long id) {
        return Result.success(rulePackageService.removeById(id));
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAuthority('PACKAGE_PUBLISH')")
    public Result<Boolean> publish(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String versionDesc = request.get("description");
        rulePackageService.publish(id);
        
        // Create version snapshot
        RuleDefinition definition = ruleDefinitionMapper.selectOneByPackageId(id);
        
        if (definition != null && definition.getContentJson() != null) {
            // Auto-generate version number
            String version = "V" + (System.currentTimeMillis() % 10000);
            
            // Get current user from security context
            org.springframework.security.core.Authentication auth = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            String createdBy = auth != null ? auth.getName() : "system";
            
            // Create version
            versionService.createVersion(id, version, versionDesc, definition.getContentJson(), createdBy);
        }
        
        return Result.success(true);
    }

    @PostMapping("/{id}/offline")
    @PreAuthorize("hasAuthority('PACKAGE_OFFLINE')")
    public Result<Boolean> offline(@PathVariable Long id) {
        rulePackageService.offline(id);
        return Result.success(true);
    }

    @PostMapping("/{id}/test")
    public Map<String, Object> test(@PathVariable Long id, @RequestBody Map<String, Object> inputs) {
        return rulePackageService.test(id, inputs);
    }

    @PostMapping("/saveGraph")
    @PreAuthorize("hasAuthority('PACKAGE_UPDATE')")
    public Result<RuleDefinition> saveGraph(@RequestBody Map<String, Object> request) {
        Long packageId = ((Number) request.get("packageId")).longValue();
        GraphDto graphData = JSON.parseObject(JSON.toJSONString(request.get("graphData")), GraphDto.class);

        // Get package
        RulePackage rulePackage = rulePackageService.getById(packageId);
        if (rulePackage == null) {
            return Result.error("Package not found");
        }

        // Convert graph to DRL
        String drl = ruleConverterService.convertToDrl(rulePackage.getCode(), graphData);

        // Save or update rule definition
        RuleDefinition definition = ruleDefinitionMapper.selectOneByPackageId(packageId);

        if (definition == null) {
            definition = new RuleDefinition();
            definition.setPackageId(packageId);
            definition.setName(rulePackage.getCode() + "_main");
            definition.setPriority(1);
        }

        definition.setContentJson(JSON.toJSONString(graphData));
        definition.setDrlContent(drl);
        definition.setDescription("Generated from visual editor");

        if (definition.getId() == null) {
            ruleDefinitionMapper.insert(definition);
        } else {
            ruleDefinitionMapper.updateById(definition);
        }

        return Result.success(definition);
    }

    @GetMapping("/loadGraph/{packageId}")
    @PreAuthorize("hasAuthority('PACKAGE_READ')")
    public Result<GraphDto> loadGraph(@PathVariable Long packageId) {
        // Load rule definition
        RuleDefinition definition = ruleDefinitionMapper.selectOneByPackageId(packageId);

        if (definition == null || definition.getContentJson() == null) {
            return Result.success(null);
        }

        GraphDto graph = JSON.parseObject(definition.getContentJson(), GraphDto.class);
        return Result.success(graph);
    }
}
