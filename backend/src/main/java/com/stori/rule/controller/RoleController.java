package com.stori.rule.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import com.stori.rule.common.Result;
import com.stori.rule.entity.SysPermission;
import com.stori.rule.entity.SysRole;
import com.stori.rule.mapper.SysPermissionMapper;
import com.stori.rule.mapper.SysRoleMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    @Autowired
    private SysRoleMapper roleMapper;

    @Autowired
    private SysPermissionMapper permissionMapper;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public Result<List<SysRole>> list() {
        return Result.success(roleMapper.selectList(null));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public Result<Map<String, Object>> getById(@PathVariable Long id) {
        SysRole role = roleMapper.selectById(id);
        List<SysPermission> permissions = permissionMapper.selectByRoleId(id);
        
        Map<String, Object> result = new HashMap<>();
        result.put("role", role);
        result.put("permissions", permissions);
        return Result.success(result);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_CREATE')")
    public Result<Boolean> create(@RequestBody SysRole role) {
        return Result.success(roleMapper.insert(role) > 0);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_UPDATE')")
    public Result<Boolean> update(@PathVariable Long id, @RequestBody SysRole role) {
        role.setId(id);
        return Result.success(roleMapper.updateById(role) > 0);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_DELETE')")
    public Result<Boolean> delete(@PathVariable Long id) {
        return Result.success(roleMapper.deleteById(id) > 0);
    }
}
