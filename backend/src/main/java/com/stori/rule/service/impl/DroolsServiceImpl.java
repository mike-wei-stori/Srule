package com.stori.rule.service.impl;

import com.alibaba.fastjson.JSON;
import com.stori.rule.dto.PackageSnapshot;
import com.stori.rule.entity.*;
import com.stori.rule.executor.FeatureExecutor;
import com.stori.rule.executor.FeatureExecutorFactory;
import com.stori.rule.mapper.*;
import com.stori.rule.service.DroolsService;
import lombok.extern.slf4j.Slf4j;
import org.kie.api.KieBase;
import org.kie.api.io.ResourceType;
import org.kie.api.runtime.KieSession;
import org.kie.internal.utils.KieHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.Data;

@Service
@Slf4j
public class DroolsServiceImpl implements DroolsService {

    @Autowired
    private RulePackageMapper rulePackageMapper;
    
    @Autowired
    private RuleDefinitionMapper ruleDefinitionMapper;

    @Autowired
    private RuleVariableMapper ruleVariableMapper;

    @Autowired
    private RulePackageVersionMapper rulePackageVersionMapper;

    @Autowired
    private FeatureMapper featureMapper;

    @Autowired
    private FeatureExecutorFactory featureExecutorFactory;

    @Autowired
    private com.stori.rule.service.AsyncRecordService asyncRecordService;

    // Cache KieBase by cache key (packageCode for draft, packageCode:verId for prod)
    private final Map<String, KieBase> kieBaseCache = new ConcurrentHashMap<>();
    
    // Cache Package Metadata by cache key
    private final Map<String, PackageMetadata> metadataCache = new ConcurrentHashMap<>();

    @Data
    private static class PackageMetadata {
        private RulePackage rulePackage;
        private List<RuleVariable> variables;
        private Map<Long, Feature> featureMap;
    }

    @Override
    public Map<String, Object> execute(String packageCode, Map<String, Object> inputs) {
        // Production Execution: Use Active Version
        RulePackage pkg = rulePackageMapper.selectByCode(packageCode);
        if (pkg == null) throw new RuntimeException("Package not found: " + packageCode);
        
        if (pkg.getActiveVersionId() == null) {
            throw new RuntimeException("No active version for package: " + packageCode);
        }

        String cacheKey = packageCode + ":" + pkg.getActiveVersionId();
        
        PackageMetadata metadata = metadataCache.computeIfAbsent(cacheKey, k -> loadProductionMetadata(pkg, pkg.getActiveVersionId()));
        KieBase kieBase = kieBaseCache.computeIfAbsent(cacheKey, k -> loadProductionKieBase(metadata, pkg.getActiveVersionId()));
        
        return internalExecute(packageCode, inputs, metadata, kieBase);
    }

    @Override
    public Map<String, Object> executeDraft(String packageCode, Map<String, Object> inputs) {
        // Draft Execution: Use Current DB State (Draft)

        PackageMetadata metadata = loadDraftMetadata(packageCode);
        KieBase kieBase = loadDraftKieBase(packageCode);
        
        return internalExecute(packageCode, inputs, metadata, kieBase);
    }

    private Map<String, Object> internalExecute(String packageCode, Map<String, Object> inputs, PackageMetadata metadata, KieBase kieBase) {
        long startTime = System.currentTimeMillis();
        String reqId = java.util.UUID.randomUUID().toString();
        String status = "SUCCESS";
        String errorMsg = null;

        try {
            // 1. Enrich inputs with Features
            if (metadata.getVariables() != null) {
                for (RuleVariable var : metadata.getVariables()) {
                    if (var.getFeatureId() != null) {
                        Feature feature = metadata.getFeatureMap().get(var.getFeatureId());
                        if (feature != null) {
                            FeatureExecutor executor = featureExecutorFactory.getExecutor(feature.getType());
                            if (executor != null) {
                                long featureStartTime = System.currentTimeMillis();
                                Object value = executor.execute(feature, inputs);
                                long featureEndTime = System.currentTimeMillis();
                                
                                // Record feature execution
                                asyncRecordService.recordFeature(reqId, feature.getId(), feature.getName(), value, featureEndTime - featureStartTime);
                                
                                inputs.put(var.getCode(), value);
                            }
                        }
                    }
                }
            }

            // 2. Execute Rules
            KieSession kieSession = kieBase.newKieSession();
            
            // Insert inputs
            for (Map.Entry<String, Object> entry : inputs.entrySet()) {
                kieSession.insert(entry.getValue());
            }
            // Also insert the map itself if rules need to access it directly
            kieSession.insert(inputs);
            
            kieSession.fireAllRules();
            kieSession.dispose();
            
            return inputs;
        } catch (Exception e) {
            status = "FAIL";
            errorMsg = e.getMessage();
            throw e;
        } finally {
            long endTime = System.currentTimeMillis();
            asyncRecordService.recordRuleExecution(reqId, packageCode, inputs, inputs, endTime - startTime, status, errorMsg);
        }
    }

    @Override
    public void reloadRules(String packageCode) {
        log.info("Reloading rules and metadata for package: {}", packageCode);
        // Clear caches for Draft
        String draftKey = packageCode + ":DRAFT";
        kieBaseCache.remove(draftKey);
        metadataCache.remove(draftKey);
        
        // Note: Production versions are immutable so we don't strictly need to clear them unless we want to free memory,
        // but explicit reload usually targets Draft development cycle.
    }

    // --- Draft Loaders ---

    private PackageMetadata loadDraftMetadata(String packageCode) {
        log.info("Loading draft metadata for package: {}", packageCode);
        RulePackage pkg = rulePackageMapper.selectByCode(packageCode);
        if (pkg == null) throw new RuntimeException("Package not found: " + packageCode);

        List<RuleVariable> variables = ruleVariableMapper.selectByPackageId(pkg.getId());
        Map<Long, Feature> featureMap = new HashMap<>();
        
        for (RuleVariable var : variables) {
            if (var.getFeatureId() != null) {
                Feature feature = featureMapper.selectById(var.getFeatureId());
                if (feature != null) {
                    featureMap.put(feature.getId(), feature);
                }
            }
        }
        
        PackageMetadata metadata = new PackageMetadata();
        metadata.setRulePackage(pkg);
        metadata.setVariables(variables);
        metadata.setFeatureMap(featureMap);
        return metadata;
    }

    private KieBase loadDraftKieBase(String packageCode) {
        log.info("Building draft KieBase for package: {}", packageCode);
        RulePackage pkg = rulePackageMapper.selectByCode(packageCode);
        if (pkg == null) {
            throw new RuntimeException("Package not found: " + packageCode);
        }

        List<RuleDefinition> rules = ruleDefinitionMapper.selectByPackageId(pkg.getId());

        KieHelper kieHelper = new KieHelper();
        for (RuleDefinition rule : rules) {
            if (rule.getDrlContent() != null && !rule.getDrlContent().isEmpty()) {
                kieHelper.addContent(rule.getDrlContent(), ResourceType.DRL);
            }
        }
        
        return kieHelper.build();
    }
    
    // --- Production Loaders ---
    
    private PackageMetadata loadProductionMetadata(RulePackage pkg, Long versionId) {
        log.info("Loading production metadata for package: {}, version: {}", pkg.getCode(), versionId);
        RulePackageVersion version = rulePackageVersionMapper.selectById(versionId);
        if (version == null) throw new RuntimeException("Version not found: " + versionId);
        
        PackageSnapshot snapshot = JSON.parseObject(version.getSnapshotData(), PackageSnapshot.class);
        if (snapshot == null) throw new RuntimeException("Invalid snapshot data for version: " + versionId);
        
        PackageMetadata metadata = new PackageMetadata();
        metadata.setRulePackage(pkg);
        metadata.setVariables(snapshot.getVariables());
        metadata.setFeatureMap(snapshot.getFeatureMap());
        
        return metadata;
    }
    
    private KieBase loadProductionKieBase(PackageMetadata metadata, Long versionId) {
        log.info("Building production KieBase for package: {}, version: {}", metadata.getRulePackage().getCode(), versionId);
        // We need to fetch snapshot again or store it in metadata? 
        // Ideally we should pass snapshot or access it. 
        // For simplicity, let's reload version (cached by DB usually fast enough) or assume metadata has what we need?
        // PackageMetadata doesn't have rules. 
        // Optimization: loadProductionMetadata could return a wrapper with snapshot.
        // Or we just fetch version again here.
        
        RulePackageVersion version = rulePackageVersionMapper.selectById(versionId);
        PackageSnapshot snapshot = JSON.parseObject(version.getSnapshotData(), PackageSnapshot.class);
        
        KieHelper kieHelper = new KieHelper();
        if (snapshot.getRuleDefinitions() != null) {
            for (RuleDefinition rule : snapshot.getRuleDefinitions()) {
                if (rule.getDrlContent() != null && !rule.getDrlContent().isEmpty()) {
                    kieHelper.addContent(rule.getDrlContent(), ResourceType.DRL);
                }
            }
        }
        
        return kieHelper.build();
    }
}
