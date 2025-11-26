package com.stori.rule.controller;

import com.stori.rule.common.Result;
import com.stori.rule.entity.RulePackageVersion;
import com.stori.rule.service.RulePackageVersionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/packages")
public class RulePackageVersionController {

    @Autowired
    private RulePackageVersionService versionService;

    @PostMapping("/{id}/versions")
    @PreAuthorize("hasAuthority('PACKAGE_PUBLISH')")
    public Result<RulePackageVersion> createVersion(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        
        String version = request.get("version");
        String description = request.get("description");
        String contentJson = request.get("contentJson");
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String createdBy = auth != null ? auth.getName() : "system";
        
        RulePackageVersion packageVersion = versionService.createVersion(
            id, version, description, contentJson, createdBy
        );
        
        return Result.success(packageVersion);
    }

    @GetMapping("/{id}/versions")
    @PreAuthorize("hasAuthority('PACKAGE_READ')")
    public Result<List<RulePackageVersion>> getVersions(@PathVariable Long id) {
        List<RulePackageVersion> versions = versionService.getVersionsByPackageId(id);
        return Result.success(versions);
    }

    @PostMapping("/{id}/versions/{versionId}/rollback")
    @PreAuthorize("hasAuthority('PACKAGE_UPDATE')")
    public Result<Boolean> rollback(
            @PathVariable Long id,
            @PathVariable Long versionId) {
        
        versionService.rollbackToVersion(id, versionId);
        return Result.success(true);
    }

    @PostMapping("/{id}/versions/{versionId}/activate")
    @PreAuthorize("hasAuthority('PACKAGE_PUBLISH')")
    public Result<Boolean> activate(
            @PathVariable Long id,
            @PathVariable Long versionId) {
        
        versionService.activateVersion(id, versionId);
        return Result.success(true);
    }
}
