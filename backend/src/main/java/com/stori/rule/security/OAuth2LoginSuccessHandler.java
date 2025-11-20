package com.stori.rule.security;

import com.stori.rule.entity.SysUser;
import com.stori.rule.mapper.SysUserMapper;
import com.stori.rule.utils.JwtUtils;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    @Autowired
    private SysUserMapper userMapper;

    @Autowired
    private JwtUtils jwtUtils;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        // Find or create user
        SysUser user = userMapper.selectByEmail(email);
        if (user == null) {
            user = new SysUser();
            user.setNickname(name);
            user.setUsername(email); // Use email as username
            user.setEmail(email);
            user.setPassword(""); // No password for OAuth users
            userMapper.insert(user);
        }

        // Generate JWT
        String token = JwtUtils.createToken(user.getId(), user.getUsername());

        // Redirect to frontend with token
        response.sendRedirect("http://localhost:8000/oauth/callback?token=" + token);
    }
}
