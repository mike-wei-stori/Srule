package com.stori.rule.service.impl;

import com.alibaba.fastjson.JSON;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.stori.rule.entity.RuleDefinition;
import com.stori.rule.entity.RulePackageVersion;
import com.stori.rule.mapper.RuleDefinitionMapper;
import com.stori.rule.mapper.RulePackageVersionMapper;
import com.stori.rule.service.RulePackageVersionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RulePackageVersionServiceImpl extends ServiceImpl<RulePackageVersionMapper, RulePackageVersion> implements RulePackageVersionService {

    @Autowired
    private RuleDefinitionMapper ruleDefinitionMapper;

    @Override
    public RulePackageVersion createVersion(Long packageId, String version, String description, String contentJson, String createdBy) {
        RulePackageVersion packageVersion = new RulePackageVersion();
        packageVersion.setPackageId(packageId);
        packageVersion.setVersion(version);
        packageVersion.setDescription(description);
        packageVersion.setContentJson(contentJson);
        packageVersion.setCreatedBy(createdBy);
        packageVersion.setCreatedAt(LocalDateTime.now());
        
        this.save(packageVersion);
        return packageVersion;
    }

    @Override
    public List<RulePackageVersion> getVersionsByPackageId(Long packageId) {
        return ((RulePackageVersionMapper)this.baseMapper).selectByPackageIdOrderByCreatedAtDesc(packageId);
    }

    @Override
    public void rollbackToVersion(Long packageId, Long versionId) {
        // Get the version
        RulePackageVersion version = this.getById(versionId);
        if (version == null || !version.getPackageId().equals(packageId)) {
            throw new RuntimeException("Version not found or does not belong to this package");
        }

        // Get the current rule definition
        RuleDefinition definition = ruleDefinitionMapper.selectOneByPackageId(packageId);

        if (definition != null) {
            // Update the content_json with the version snapshot
            definition.setContentJson(version.getContentJson());
            ruleDefinitionMapper.updateById(definition);
        }
    }
}
