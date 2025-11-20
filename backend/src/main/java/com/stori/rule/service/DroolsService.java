package com.stori.rule.service;

import java.util.Map;

public interface DroolsService {
    /**
     * Execute rules for a given package
     * @param packageCode The code of the rule package
     * @param inputs Input variables
     * @return Output variables
     */
    Map<String, Object> execute(String packageCode, Map<String, Object> inputs);

    /**
     * Reload rules for a package (recompile DRL)
     * @param packageCode The code of the rule package
     */
    void reloadRules(String packageCode);
}
