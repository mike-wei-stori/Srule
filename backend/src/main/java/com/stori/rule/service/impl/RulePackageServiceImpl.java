package com.stori.rule.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.stori.rule.entity.RulePackage;
import com.stori.rule.mapper.RulePackageMapper;
import com.stori.rule.service.DroolsService;
import com.stori.rule.service.RulePackageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class RulePackageServiceImpl extends ServiceImpl<RulePackageMapper, RulePackage> implements RulePackageService {

    @Autowired
    private DroolsService droolsService;
    @Override
    public void publish(Long id) {
        RulePackage pkg = this.getById(id);
        if (pkg == null) throw new RuntimeException("Package not found");
        
        pkg.setStatus("PUBLISHED");
        this.updateById(pkg);
        
        // Reload rules in engine
        droolsService.reloadRules(pkg.getCode());
    }

    @Override
    public void offline(Long id) {
        RulePackage pkg = this.getById(id);
        if (pkg == null) throw new RuntimeException("Package not found");
        
        pkg.setStatus("ARCHIVED");
        this.updateById(pkg);
    }

    @Override
    public Map<String, Object> test(Long id, Map<String, Object> inputs) {
        RulePackage pkg = this.getById(id);
        if (pkg == null) throw new RuntimeException("Package not found");
        
        // For testing, we might want to reload first to ensure latest draft is used
        // Or we can have a separate "test" execution mode.
        // For simplicity, we'll reload and execute.
        // droolsService.reloadRules(pkg.getCode());
        return droolsService.execute(pkg.getCode(), inputs);
    }
    @Override
    public java.util.List<RulePackage> list(RulePackage rulePackage) {
        return baseMapper.selectList(rulePackage);
    }
}
