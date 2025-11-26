package com.stori.rule.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.stori.rule.entity.SysConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface SysConfigMapper extends BaseMapper<SysConfig> {
    SysConfig selectByKey(@Param("key") String key);
    
    int deleteByKey(@Param("key") String key);
}
