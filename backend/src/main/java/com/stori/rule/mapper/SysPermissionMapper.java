package com.stori.rule.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.stori.rule.entity.SysPermission;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SysPermissionMapper extends BaseMapper<SysPermission> {
    SysPermission selectByCode(@Param("code") String code);
    List<SysPermission> selectByRoleId(@Param("roleId") Long roleId);
    List<SysPermission> selectByUserId(@Param("userId") Long userId);
}
