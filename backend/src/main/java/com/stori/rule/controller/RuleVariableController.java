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

    @GetMapping("/package/{packageId}")
    public Result<List<RuleVariable>> listByPackage(@PathVariable Long packageId) {
        List<RuleVariable> variables = ruleVariableMapper.selectByPackageId(packageId);
        return Result.success(variables);
    }

    @PostMapping
    public Result<RuleVariable> create(@RequestBody RuleVariable variable) {
        ruleVariableMapper.insert(variable);
        return Result.success(variable);
    }

    @PutMapping("/{id}")
    public Result<Boolean> update(@PathVariable Long id, @RequestBody RuleVariable variable) {
        variable.setId(id);
        return Result.success(ruleVariableMapper.updateById(variable) > 0);
    }

    @DeleteMapping("/{id}")
    public Result<Boolean> delete(@PathVariable Long id) {
        return Result.success(ruleVariableMapper.deleteById(id) > 0);
    }
}
