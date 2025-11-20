package com.stori.rule.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.stori.rule.entity.RulePackageVersion;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface RulePackageVersionMapper extends BaseMapper<RulePackageVersion> {
    List<RulePackageVersion> selectByPackageIdOrderByCreatedAtDesc(@Param("packageId") Long packageId);
    RulePackageVersion selectLatestByPackageId(@Param("packageId") Long packageId);
}
