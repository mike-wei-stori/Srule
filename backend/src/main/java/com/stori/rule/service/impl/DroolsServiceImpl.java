package com.stori.rule.service.impl;

import com.stori.rule.entity.Feature;
import com.stori.rule.entity.RuleDefinition;
import com.stori.rule.entity.RulePackage;
import com.stori.rule.entity.RuleVariable;
import com.stori.rule.executor.FeatureExecutor;
import com.stori.rule.executor.FeatureExecutorFactory;
import com.stori.rule.mapper.FeatureMapper;
import com.stori.rule.mapper.RuleDefinitionMapper;
import com.stori.rule.mapper.RulePackageMapper;
import com.stori.rule.mapper.RuleVariableMapper;
import com.stori.rule.service.DroolsService;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.kie.api.KieBase;
import org.kie.api.io.ResourceType;
import org.kie.api.runtime.KieSession;
import org.kie.internal.utils.KieHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
    private FeatureMapper featureMapper;

    @Autowired
    private FeatureExecutorFactory featureExecutorFactory;

    @Autowired
    private com.stori.rule.service.AsyncRecordService asyncRecordService;

    // Cache KieBase by package code
    private final Map<String, KieBase> kieBaseCache = new ConcurrentHashMap<>();
    
    // Cache Package Metadata by package code
    private final Map<String, PackageMetadata> metadataCache = new ConcurrentHashMap<>();

    @Data
    private static class PackageMetadata {
        private RulePackage rulePackage;
        private List<RuleVariable> variables;
        private Map<Long, Feature> featureMap;
    }

    @Override
    public Map<String, Object> execute(String packageCode, Map<String, Object> inputs) {
        long startTime = System.currentTimeMillis();
        String reqId = java.util.UUID.randomUUID().toString();
        String status = "SUCCESS";
        String errorMsg = null;

        try {
            // 1. Load Metadata from Cache
            PackageMetadata metadata = metadataCache.computeIfAbsent(packageCode, this::loadPackageMetadata);
            // 2. Enrich inputs with Features
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

            // 3. Execute Rules
            KieBase kieBase = kieBaseCache.computeIfAbsent(packageCode, this::loadKieBase);
            KieSession kieSession = kieBase.newKieSession();
            
            // Insert inputs
            for (Map.Entry<String, Object> entry : inputs.entrySet()) {
                kieSession.insert(entry.getValue());
            }
            // Also insert the map itself if rules need to access it directly
            kieSession.insert(inputs);
            
            kieSession.fireAllRules();
            kieSession.dispose();
            
            return inputs; // In a real app, we might extract specific results
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
        kieBaseCache.put(packageCode, loadKieBase(packageCode));
        metadataCache.put(packageCode, loadPackageMetadata(packageCode));
    }

    private PackageMetadata loadPackageMetadata(String packageCode) {
        log.info("Loading metadata for package: {}", packageCode);
        RulePackage pkg = rulePackageMapper.selectByCode(packageCode);
        if (pkg == null) throw new RuntimeException("Package not found: " + packageCode);

        List<RuleVariable> variables = ruleVariableMapper.selectByPackageId(pkg.getId());
        Map<Long, Feature> featureMap = new java.util.HashMap<>();
        
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

    private KieBase loadKieBase(String packageCode) {
        log.info("Building KieBase for package: {}", packageCode);
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
}
