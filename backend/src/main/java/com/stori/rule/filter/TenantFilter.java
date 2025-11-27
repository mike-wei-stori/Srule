package com.stori.rule.filter;

import com.stori.rule.common.TenantContext;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TenantFilter implements Filter {

    private static final String HEADER_TENANT_ID = "X-Tenant-Id";
    private static final String PARAM_TENANT_ID = "tenantId";
    private static final String SESSION_TENANT_ID = "SESSION_TENANT_ID";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpSession session = httpRequest.getSession(false); // Do not create session if not exists yet, or maybe we should?
        
        // 1. Try header
        String tenantId = httpRequest.getHeader(HEADER_TENANT_ID);
        
        // 2. Try query param (useful for OAuth2 redirection initiation)
        if (!StringUtils.hasText(tenantId)) {
            tenantId = httpRequest.getParameter(PARAM_TENANT_ID);
        }

        // 3. If found, save to session (create session if needed)
        if (StringUtils.hasText(tenantId)) {
            session = httpRequest.getSession(true);
            session.setAttribute(SESSION_TENANT_ID, tenantId);
        } else {
            // 4. If not found, try to get from session
            if (session != null) {
                Object sessionTenantId = session.getAttribute(SESSION_TENANT_ID);
                if (sessionTenantId instanceof String) {
                    tenantId = (String) sessionTenantId;
                }
            }
        }

        // 5. Set context (if null/empty, TenantContext.getTenantId() will return DEFAULT)
        if (StringUtils.hasText(tenantId)) {
            TenantContext.setTenantId(tenantId);
        } else {
            TenantContext.setTenantId(TenantContext.DEFAULT_TENANT_ID);
        }

        try {
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
