package com.stori.rule.controller;

import com.stori.rule.dto.UserProfileDTO;
import com.stori.rule.entity.SysRole;
import com.stori.rule.entity.SysUserRole;
import com.stori.rule.mapper.SysRoleMapper;
import com.stori.rule.mapper.SysUserRoleMapper;
import org.springframework.security.access.prepost.PreAuthorize;
import com.stori.rule.common.Result;
import com.stori.rule.entity.SysUser;
import com.stori.rule.mapper.SysUserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private SysUserMapper userMapper;
    
    @Autowired
    private SysUserRoleMapper userRoleMapper;
    
    @Autowired
    private SysRoleMapper roleMapper;

    @Autowired
    private com.stori.rule.mapper.SysPermissionMapper permissionMapper;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @GetMapping
    @PreAuthorize("hasAuthority('USER_READ')")
    public Result<List<SysUser>> list() {
        List<SysUser> users = userMapper.selectList(null);
        if (users != null && !users.isEmpty()) {
            // Get all user IDs
            List<Long> userIds = users.stream().map(SysUser::getId).collect(Collectors.toList());
            
            // Get all roles for these users
            com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<SysUserRole> queryWrapper = new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
            queryWrapper.in("user_id", userIds);
            List<SysUserRole> userRoles = userRoleMapper.selectList(queryWrapper);
            
            // Map roles to users
            java.util.Map<Long, Long> userRoleMap = userRoles.stream()
                .collect(Collectors.toMap(SysUserRole::getUserId, SysUserRole::getRoleId, (existing, replacement) -> existing));
            
            for (SysUser user : users) {
                user.setRoleId(userRoleMap.get(user.getId()));
            }
        }
        return Result.success(users);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_READ')")
    public Result<SysUser> getById(@PathVariable Long id) {
        return Result.success(userMapper.selectById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('USER_CREATE')")
    public Result<Boolean> create(@RequestBody com.stori.rule.dto.UserUpdateDTO userDto) {
        SysUser user = new SysUser();
        user.setUsername(userDto.getUsername());
        user.setNickname(userDto.getNickname());
        user.setEmail(userDto.getEmail());
        user.setPhone(userDto.getPhone());
        
        // Hash password before saving
        if (userDto.getPassword() != null && !userDto.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        }
        
        boolean success = userMapper.insert(user) > 0;
        
        if (success && userDto.getRoleId() != null) {
            SysUserRole userRole = new SysUserRole();
            userRole.setUserId(user.getId());
            userRole.setRoleId(userDto.getRoleId());
            userRoleMapper.insert(userRole);
        }
        
        return Result.success(success);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    public Result<Boolean> update(@PathVariable Long id, @RequestBody com.stori.rule.dto.UserUpdateDTO userDto) {
        SysUser user = new SysUser();
        user.setId(id);
        user.setUsername(userDto.getUsername());
        user.setNickname(userDto.getNickname());
        user.setEmail(userDto.getEmail());
        user.setPhone(userDto.getPhone());
        
        // Only update password if provided
        if (userDto.getPassword() != null && !userDto.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        }

        boolean success = userMapper.updateById(user) > 0;
        
        if (success && userDto.getRoleId() != null) {
            // Delete existing roles
            com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<SysUserRole> queryWrapper = new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
            queryWrapper.eq("user_id", id);
            userRoleMapper.delete(queryWrapper);
            
            // Add new role
            SysUserRole userRole = new SysUserRole();
            userRole.setUserId(id);
            userRole.setRoleId(userDto.getRoleId());
            userRoleMapper.insert(userRole);
        }
        
        return Result.success(success);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_DELETE')")
    public Result<Boolean> delete(@PathVariable Long id) {
        // Delete user roles first
        com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<SysUserRole> queryWrapper = new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
        queryWrapper.eq("user_id", id);
        userRoleMapper.delete(queryWrapper);
        
        return Result.success(userMapper.deleteById(id) > 0);
    }

    @GetMapping("/profile")
    public Result<UserProfileDTO> getProfile(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
            if (com.stori.rule.utils.JwtUtils.validateToken(token)) {
                Long userId = com.stori.rule.utils.JwtUtils.getUserId(token);
                SysUser user = userMapper.selectById(userId);
                
                if (user != null) {
                    // Convert to DTO
                    UserProfileDTO profile = UserProfileDTO.fromUser(user);
                    
                    // Get user roles
                    List<SysUserRole> userRoles = userRoleMapper.selectByUserId(userId);
                    
                    // Get role details
                    List<UserProfileDTO.RoleInfo> roles = new ArrayList<>();
                    for (SysUserRole userRole : userRoles) {
                        SysRole role = roleMapper.selectById(userRole.getRoleId());
                        if (role != null) {
                            UserProfileDTO.RoleInfo roleInfo = new UserProfileDTO.RoleInfo();
                            roleInfo.setId(role.getId());
                            roleInfo.setName(role.getName());
                            roleInfo.setCode(role.getCode());
                            roleInfo.setDescription(role.getDescription());
                            roles.add(roleInfo);
                        }
                    }
                    profile.setRoles(roles);

                    // Get user permissions
                    List<com.stori.rule.entity.SysPermission> permissions = permissionMapper.selectByUserId(userId);
                    profile.setPermissions(permissions.stream()
                            .map(com.stori.rule.entity.SysPermission::getCode)
                            .collect(Collectors.toList()));
                    
                    return Result.success(profile);
                }
            }
        }
        return Result.error(401, "Not logged in");
    }

    @PutMapping("/profile")
    public Result<Boolean> updateProfile(@RequestBody SysUser user, HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
            if (com.stori.rule.utils.JwtUtils.validateToken(token)) {
                Long userId = com.stori.rule.utils.JwtUtils.getUserId(token);
                user.setId(userId);
                return Result.success(userMapper.updateById(user) > 0);
            }
        }
        return Result.error(401, "Not logged in");
    }
}
