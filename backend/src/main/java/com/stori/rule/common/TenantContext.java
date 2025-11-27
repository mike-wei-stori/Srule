package com.stori.rule.common;

import org.springframework.util.StringUtils;

/**
 * Tenant Context Holder
 */
public class TenantContext {
    private static final ThreadLocal<String> TENANT_ID = new ThreadLocal<>();
    public static final String DEFAULT_TENANT_ID = "DEFAULT";

    public static void setTenantId(String tenantId) {
        TENANT_ID.set(tenantId);
    }

    public static String getTenantId() {
        String tenantId = TENANT_ID.get();
        return StringUtils.hasText(tenantId) ? tenantId : DEFAULT_TENANT_ID;
    }

    public static void clear() {
        TENANT_ID.remove();
    }
}
