package com.stori.rule.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.stori.rule.entity.SysUserRole;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SysUserRoleMapper extends BaseMapper<SysUserRole> {
    List<SysUserRole> selectByUserId(@Param("userId") Long userId);
    List<SysUserRole> selectByUserIds(@Param("userIds") List<Long> userIds);
    int deleteByUserId(@Param("userId") Long userId);
}
