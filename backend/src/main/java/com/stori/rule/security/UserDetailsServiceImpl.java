package com.stori.rule.security;

import com.stori.rule.entity.SysPermission;
import com.stori.rule.entity.SysUser;
import com.stori.rule.mapper.SysPermissionMapper;
import com.stori.rule.mapper.SysUserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private SysUserMapper userMapper;

    @Autowired
    private SysPermissionMapper permissionMapper;

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
        List<SysPermission> permissions = permissionMapper.selectByUserId(sysUser.getId());
        List<SimpleGrantedAuthority> authorities = permissions.stream()
                .map(p -> new SimpleGrantedAuthority(p.getCode()))
                .collect(Collectors.toList());

        return new User(sysUser.getUsername(), sysUser.getPassword(), authorities);
    }
}
