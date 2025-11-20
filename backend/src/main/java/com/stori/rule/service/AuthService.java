package com.stori.rule.service;

import com.stori.rule.dto.LoginDto;
import com.stori.rule.entity.SysUser;

public interface AuthService {
    String login(LoginDto loginDto);
    SysUser register(SysUser user);
}
