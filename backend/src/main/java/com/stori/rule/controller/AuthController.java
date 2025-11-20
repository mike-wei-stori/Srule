package com.stori.rule.controller;

import com.stori.rule.common.Result;
import com.stori.rule.dto.LoginDto;
import com.stori.rule.entity.SysUser;
import com.stori.rule.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public Result<Map<String, String>> login(@RequestBody LoginDto loginDto) {
        String token = authService.login(loginDto);
        Map<String, String> result = new HashMap<>();
        result.put("token", token);
        return Result.success(result);
    }

    @PostMapping("/register")
    public Result<SysUser> register(@RequestBody SysUser user) {
        return Result.success(authService.register(user));
    }
}
