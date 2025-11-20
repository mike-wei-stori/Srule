package com.stori.rule.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.stori.rule.entity.Feature;
import com.stori.rule.mapper.FeatureMapper;
import com.stori.rule.service.FeatureService;
import org.springframework.stereotype.Service;

@Service
public class FeatureServiceImpl extends ServiceImpl<FeatureMapper, Feature> implements FeatureService {
}
