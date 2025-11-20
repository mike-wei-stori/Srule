package com.stori.rule.controller;

import com.stori.rule.common.Result;
import com.stori.rule.entity.SysPermission;
import com.stori.rule.entity.SysRolePermission;
import com.stori.rule.mapper.SysPermissionMapper;
import com.stori.rule.mapper.SysRolePermissionMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/permissions")
public class PermissionController {

    @Autowired
    private SysPermissionMapper permissionMapper;

    @Autowired
    private SysRolePermissionMapper rolePermissionMapper;

    @GetMapping
    public Result<List<SysPermission>> list() {
        return Result.success(permissionMapper.selectList(null));
    }

    @GetMapping("/role/{roleId}")
    public Result<List<SysPermission>> getByRoleId(@PathVariable Long roleId) {
        return Result.success(permissionMapper.selectByRoleId(roleId));
    }

    @GetMapping("/user/{userId}")
    public Result<List<SysPermission>> getByUserId(@PathVariable Long userId) {
        return Result.success(permissionMapper.selectByUserId(userId));
    }

    @PostMapping("/role/{roleId}/assign")
    public Result<Boolean> assignPermissionsToRole(@PathVariable Long roleId, @RequestBody List<Long> permissionIds) {
        // Remove existing permissions
        rolePermissionMapper.deleteByRoleId(roleId);
        
        // Add new permissions
        for (Long permissionId : permissionIds) {
            SysRolePermission rp = new SysRolePermission();
            rp.setRoleId(roleId);
            rp.setPermissionId(permissionId);
            rolePermissionMapper.insert(rp);
        }
        return Result.success(true);
    }

    @GetMapping("/check")
    public Result<Boolean> checkPermission(@RequestParam Long userId, @RequestParam String permissionCode) {
        List<SysPermission> permissions = permissionMapper.selectByUserId(userId);
        return Result.success(permissions.stream().anyMatch(p -> p.getCode().equals(permissionCode)));
    }
}
