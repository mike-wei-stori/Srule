package com.stori.rule.controller;

import com.stori.rule.common.Result;
import com.stori.rule.entity.RuleVariable;
import com.stori.rule.mapper.RuleVariableMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/variables")
public class RuleVariableController {

    @Autowired
    private RuleVariableMapper ruleVariableMapper;

    @Autowired
    private com.stori.rule.mapper.RulePackageMapper rulePackageMapper;

    @Autowired
    private com.stori.rule.service.DroolsService droolsService;

    @GetMapping("/package/{packageId}")
    public Result<List<RuleVariable>> listByPackage(@PathVariable Long packageId) {
        List<RuleVariable> variables = ruleVariableMapper.selectByPackageId(packageId);
        return Result.success(variables);
    }

    @PostMapping
    public Result<RuleVariable> create(@RequestBody RuleVariable variable) {
        ruleVariableMapper.insert(variable);
        refreshCache(variable.getPackageId());
        return Result.success(variable);
    }

    @PutMapping("/{id}")
    public Result<Boolean> update(@PathVariable Long id, @RequestBody RuleVariable variable) {
        variable.setId(id);
        boolean success = ruleVariableMapper.updateById(variable) > 0;
        if (success) {
            // We need packageId to refresh cache. 
            // If it's not in the request body, we might need to fetch it.
            // Assuming for now it is passed or we fetch the updated record.
            // To be safe, let's fetch the variable from DB if packageId is null
            if (variable.getPackageId() == null) {
                RuleVariable updated = ruleVariableMapper.selectById(id);
                if (updated != null) {
                    refreshCache(updated.getPackageId());
                }
            } else {
                refreshCache(variable.getPackageId());
            }
        }
        return Result.success(success);
    }

    @DeleteMapping("/{id}")
    public Result<Boolean> delete(@PathVariable Long id) {
        RuleVariable variable = ruleVariableMapper.selectById(id);
        if (variable == null) return Result.success(true);
        
        Long packageId = variable.getPackageId();
        boolean success = ruleVariableMapper.deleteById(id) > 0;
        if (success) {
            refreshCache(packageId);
        }
        return Result.success(success);
    }

    private void refreshCache(Long packageId) {
        if (packageId != null) {
            com.stori.rule.entity.RulePackage pkg = rulePackageMapper.selectById(packageId);
            if (pkg != null) {
                droolsService.reloadRules(pkg.getCode());
            }
        }
    }
}
