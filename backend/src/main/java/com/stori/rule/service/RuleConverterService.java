package com.stori.rule.service;

import com.stori.rule.dto.GraphDto;

public interface RuleConverterService {
    String convertToDrl(String packageCode, GraphDto graph);
}
