package com.stori.rule.controller;

import com.stori.rule.common.Result;
import com.stori.rule.entity.SysConfig;
import com.stori.rule.service.SysConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sys/config")
public class SysConfigController {

    @Autowired
    private SysConfigService sysConfigService;

    @GetMapping("/list")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<List<SysConfig>> list() {
        return Result.success(sysConfigService.getAllConfigs());
    }

    @GetMapping("/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<String> getValue(@PathVariable String key) {
        return Result.success(sysConfigService.getValue(key));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> save(@RequestBody SysConfig config) {
        sysConfigService.setValue(config.getConfigKey(), config.getConfigValue(), config.getDescription());
        return Result.success();
    }

    @DeleteMapping("/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> delete(@PathVariable String key) {
        sysConfigService.deleteConfig(key);
        return Result.success();
    }
}

