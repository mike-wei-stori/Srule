package com.stori.rule.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.stori.rule.entity.SysRole;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface SysRoleMapper extends BaseMapper<SysRole> {
    SysRole selectByCode(@Param("code") String code);
}
