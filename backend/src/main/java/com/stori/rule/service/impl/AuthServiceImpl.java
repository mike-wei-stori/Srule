package com.stori.rule.service.impl;

import com.stori.rule.dto.LoginDto;
import com.stori.rule.entity.SysUser;
import com.stori.rule.mapper.SysUserMapper;
import com.stori.rule.service.AuthService;
import com.stori.rule.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private SysUserMapper userMapper;

    @Autowired
    private JwtUtils jwtUtils;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public String login(LoginDto loginDto) {
        SysUser user = userMapper.selectByUsername(loginDto.getUsername());
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        
        if (!passwordEncoder.matches(loginDto.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }
        return JwtUtils.createToken(user.getId(), user.getUsername());
    }

    @Override
    public SysUser register(SysUser user) {
        // Check if exists
        Long count = userMapper.countByUsername(user.getUsername());
        if (count > 0) {
            throw new RuntimeException("Username already exists");
        }
        // Hash password
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userMapper.insert(user);
        return user;
    }
}
