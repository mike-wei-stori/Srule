package com.stori.rule.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.stori.rule.entity.SysRolePermission;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface SysRolePermissionMapper extends BaseMapper<SysRolePermission> {
    int deleteByRoleId(@Param("roleId") Long roleId);
    SysRolePermission selectByRoleAndPermission(@Param("roleId") Long roleId, @Param("permissionId") Long permissionId);
    int countByRoleAndPermission(@Param("roleId") Long roleId, @Param("permissionId") Long permissionId);
}
