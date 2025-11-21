package com.stori.rule.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.security.access.prepost.PreAuthorize;
import com.stori.rule.common.Result;
import com.stori.rule.entity.Feature;
import com.stori.rule.service.FeatureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/features")
public class FeatureController {

    @Autowired
    private FeatureService featureService;

    @GetMapping
    @PreAuthorize("hasAuthority('FEATURE_READ')")
    public Result<List<Feature>> list() {
        return Result.success(featureService.list());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('FEATURE_READ')")
    public Result<Feature> getById(@PathVariable Long id) {
        return Result.success(featureService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('FEATURE_CREATE')")
    public Result<Boolean> create(@RequestBody Feature feature) {
        return Result.success(featureService.save(feature));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('FEATURE_UPDATE')")
    public Result<Boolean> update(@PathVariable Long id, @RequestBody Feature feature) {
        feature.setId(id);
        return Result.success(featureService.updateById(feature));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('FEATURE_DELETE')")
    public Result<Boolean> delete(@PathVariable Long id) {
        return Result.success(featureService.removeById(id));
    }

    @PostMapping("/{id}/execute")
    @PreAuthorize("hasAuthority('FEATURE_READ')")
    public Result<Object> execute(@PathVariable Long id, @RequestBody java.util.Map<String, Object> context) {
        return Result.success(featureService.execute(id, context));
    }
}
