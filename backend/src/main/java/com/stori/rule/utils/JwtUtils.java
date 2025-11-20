package com.stori.rule.utils;

import cn.hutool.jwt.JWT;
import cn.hutool.jwt.JWTUtil;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtils {

    private static final byte[] KEY = "srule-secret-key".getBytes();

    public static String createToken(Long userId, String username) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("uid", userId);
        payload.put("sub", username);
        payload.put("exp", System.currentTimeMillis() + 1000 * 60 * 60 * 24); // 24 hours
        return JWTUtil.createToken(payload, KEY);
    }

    public static boolean validateToken(String token) {
        try {
            return JWTUtil.verify(token, KEY);
        } catch (Exception e) {
            return false;
        }
    }

    public static Long getUserId(String token) {
        final JWT jwt = JWTUtil.parseToken(token);
        return Long.valueOf(jwt.getPayload("uid").toString());
    }
}
