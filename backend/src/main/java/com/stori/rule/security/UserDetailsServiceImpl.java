package com.stori.rule.security;

import com.stori.rule.entity.SysPermission;
import com.stori.rule.entity.SysRole;
import com.stori.rule.entity.SysUser;
import com.stori.rule.mapper.SysPermissionMapper;
import com.stori.rule.mapper.SysRoleMapper;
import com.stori.rule.mapper.SysUserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private SysUserMapper userMapper;

    @Autowired
    private SysPermissionMapper permissionMapper;

    @Autowired
    private SysRoleMapper roleMapper;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        SysUser sysUser = userMapper.selectByUsername(username);
        if (sysUser == null) {
            throw new UsernameNotFoundException("User not found: " + username);
        }
        return createSpringUser(sysUser);
    }
    
    public UserDetails loadUserById(Long id) {
        SysUser sysUser = userMapper.selectById(id);
        if (sysUser == null) {
            throw new UsernameNotFoundException("User not found with id: " + id);
        }
        return createSpringUser(sysUser);
    }

    private UserDetails createSpringUser(SysUser sysUser) {
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();

        // Add Roles with ROLE_ prefix
        List<SysRole> roles = roleMapper.selectByUserId(sysUser.getId());
        for (SysRole role : roles) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getCode()));
        }

        // Add Permissions
        List<SysPermission> permissions = permissionMapper.selectByUserId(sysUser.getId());
        for (SysPermission permission : permissions) {
            authorities.add(new SimpleGrantedAuthority(permission.getCode()));
        }

        return new User(sysUser.getUsername(), sysUser.getPassword(), authorities);
    }
}
