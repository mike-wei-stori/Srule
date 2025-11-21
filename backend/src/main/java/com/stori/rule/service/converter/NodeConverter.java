package com.stori.rule.service.converter;

import com.stori.rule.dto.NodeDto;

public interface NodeConverter {
    boolean supports(String nodeType);
    String convert(NodeDto node, ConverterContext context);
}
