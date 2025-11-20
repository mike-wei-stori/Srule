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

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @GetMapping
    @PreAuthorize("hasAuthority('USER_READ')")
    public Result<List<SysUser>> list() {
        return Result.success(userMapper.selectList(null));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_READ')")
    public Result<SysUser> getById(@PathVariable Long id) {
        return Result.success(userMapper.selectById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('USER_CREATE')")
    public Result<Boolean> create(@RequestBody SysUser user) {
        // Hash password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return Result.success(userMapper.insert(user) > 0);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    public Result<Boolean> update(@PathVariable Long id, @RequestBody SysUser user) {
        user.setId(id);
        return Result.success(userMapper.updateById(user) > 0);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_DELETE')")
    public Result<Boolean> delete(@PathVariable Long id) {
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
