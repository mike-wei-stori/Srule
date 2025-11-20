package com.stori.rule.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.stori.rule.entity.RuleVariable;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface RuleVariableMapper extends BaseMapper<RuleVariable> {
    List<RuleVariable> selectByPackageId(@Param("packageId") Long packageId);
}
