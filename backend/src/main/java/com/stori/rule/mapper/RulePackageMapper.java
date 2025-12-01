package com.stori.rule.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.stori.rule.entity.RulePackage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface RulePackageMapper extends BaseMapper<RulePackage> {
    RulePackage selectByCode(@Param("code") String code);
    java.util.List<RulePackage> selectList(@Param("param") RulePackage rulePackage);
}
