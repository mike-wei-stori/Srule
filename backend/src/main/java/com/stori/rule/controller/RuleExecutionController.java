package com.stori.rule.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import com.stori.rule.common.Result;
import com.stori.rule.service.DroolsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/execute")
public class RuleExecutionController {

    @Autowired
    private DroolsService droolsService;

    @PostMapping("/execute")
    @PreAuthorize("hasAuthority('RULE_EXECUTE')")
    public Result<Object> execute(@RequestBody Map<String, Object> payload) {
        String packageCode = (String) payload.get("packageCode");
        Map<String, Object> inputs = (Map<String, Object>) payload.get("inputs");
        return Result.success(droolsService.execute(packageCode, inputs));
    }

    @PostMapping("/test")
    @PreAuthorize("hasAuthority('RULE_EXECUTE')")
    public Result<Object> test(@RequestBody Map<String, Object> payload) {
        String packageCode = (String) payload.get("packageCode");
        Map<String, Object> inputs = (Map<String, Object>) payload.get("inputs");
        return Result.success(droolsService.executeDraft(packageCode, inputs));
    }

    @PostMapping("/reload")
    @PreAuthorize("hasAuthority('PACKAGE_PUBLISH')")
    public Result<String> reload(@RequestParam String packageCode) {
        droolsService.reloadRules(packageCode);
        return Result.success("Rules reloaded for package: " + packageCode);
    }
}
