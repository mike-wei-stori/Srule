package com.stori.rule.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.stori.rule.entity.RulePackageVersion;

import java.util.List;

public interface RulePackageVersionService extends IService<RulePackageVersion> {
    /**
     * Create a new version for a package
     */
    RulePackageVersion createVersion(Long packageId, String version, String description, String contentJson, String createdBy);
    
    /**
     * Get all versions for a package
     */
    List<RulePackageVersion> getVersionsByPackageId(Long packageId);
    
    /**
     * Rollback to a specific version
     */
    void rollbackToVersion(Long packageId, Long versionId);
}
