package com.stori.rule.config;

import com.stori.rule.entity.SysPermission;
import com.stori.rule.entity.SysRole;
import com.stori.rule.entity.SysRolePermission;
import com.stori.rule.mapper.SysPermissionMapper;
import com.stori.rule.mapper.SysRoleMapper;
import com.stori.rule.mapper.SysRolePermissionMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Database Initialization Component
 * Automatically initializes roles and permissions on application startup
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseInitializer implements CommandLineRunner {

    private final SysRoleMapper roleMapper;
    private final SysPermissionMapper permissionMapper;
    private final SysRolePermissionMapper rolePermissionMapper;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Starting database initialization...");
        
        try {
            initializeRoles();
            initializePermissions();
            assignPermissionsToRoles();
            log.info("Database initialization completed successfully");
        } catch (Exception e) {
            log.error("Database initialization failed", e);
            // Don't throw exception to prevent application startup failure
        }
    }

    /**
     * Initialize default roles
     */
    private void initializeRoles() {
        List<SysRole> defaultRoles = Arrays.asList(
            createRole("Administrator", "ADMIN", "Full system access with all permissions"),
            createRole("Rule Manager", "RULE_MANAGER", "Can manage rules, packages, and features"),
            createRole("Viewer", "VIEWER", "Read-only access to view rules and packages")
        );

        for (SysRole role : defaultRoles) {
            SysRole existing = roleMapper.selectByCode(role.getCode());
            if (existing == null) {
                roleMapper.insert(role);
                log.info("Created role: {}", role.getName());
            } else {
                log.debug("Role already exists: {}", role.getName());
            }
        }
    }

    /**
     * Initialize default permissions
     */
    private void initializePermissions() {
        List<SysPermission> defaultPermissions = new ArrayList<>();

        // User Management Permissions
        defaultPermissions.add(createPermission("View Users", "USER_READ", "/api/users", "READ", "View user list and details"));
        defaultPermissions.add(createPermission("Create User", "USER_CREATE", "/api/users", "CREATE", "Create new users"));
        defaultPermissions.add(createPermission("Update User", "USER_UPDATE", "/api/users", "UPDATE", "Update user information"));
        defaultPermissions.add(createPermission("Delete User", "USER_DELETE", "/api/users", "DELETE", "Delete users"));

        // Role Management Permissions
        defaultPermissions.add(createPermission("View Roles", "ROLE_READ", "/api/roles", "READ", "View role list and details"));
        defaultPermissions.add(createPermission("Create Role", "ROLE_CREATE", "/api/roles", "CREATE", "Create new roles"));
        defaultPermissions.add(createPermission("Update Role", "ROLE_UPDATE", "/api/roles", "UPDATE", "Update role information"));
        defaultPermissions.add(createPermission("Delete Role", "ROLE_DELETE", "/api/roles", "DELETE", "Delete roles"));

        // Feature Management Permissions
        defaultPermissions.add(createPermission("View Features", "FEATURE_READ", "/api/features", "READ", "View feature list and details"));
        defaultPermissions.add(createPermission("Create Feature", "FEATURE_CREATE", "/api/features", "CREATE", "Create new features"));
        defaultPermissions.add(createPermission("Update Feature", "FEATURE_UPDATE", "/api/features", "UPDATE", "Update feature configuration"));
        defaultPermissions.add(createPermission("Delete Feature", "FEATURE_DELETE", "/api/features", "DELETE", "Delete features"));

        // Rule Package Management Permissions
        defaultPermissions.add(createPermission("View Packages", "PACKAGE_READ", "/api/packages", "READ", "View rule packages"));
        defaultPermissions.add(createPermission("Create Package", "PACKAGE_CREATE", "/api/packages", "CREATE", "Create new rule packages"));
        defaultPermissions.add(createPermission("Update Package", "PACKAGE_UPDATE", "/api/packages", "UPDATE", "Update rule packages"));
        defaultPermissions.add(createPermission("Delete Package", "PACKAGE_DELETE", "/api/packages", "DELETE", "Delete rule packages"));
        defaultPermissions.add(createPermission("Publish Package", "PACKAGE_PUBLISH", "/api/packages", "PUBLISH", "Publish rule packages"));
        defaultPermissions.add(createPermission("Test Package", "PACKAGE_TEST", "/api/packages", "TEST", "Test rule packages"));
        defaultPermissions.add(createPermission("Offline Package", "PACKAGE_OFFLINE", "/api/packages", "OFFLINE", "Offline rule packages"));

        // Package Version Management Permissions
        defaultPermissions.add(createPermission("View Versions", "PACKAGE_VERSION_READ", "/api/packages/versions", "READ", "View package versions"));
        defaultPermissions.add(createPermission("Rollback Version", "PACKAGE_VERSION_ROLLBACK", "/api/packages/versions", "ROLLBACK", "Rollback to version"));

        // Record Management Permissions
        defaultPermissions.add(createPermission("View Records", "RECORD_READ", "/api/records", "READ", "View execution records"));

        // Rule Definition Management Permissions
        defaultPermissions.add(createPermission("View Definitions", "DEFINITION_READ", "/api/definitions", "READ", "View rule definitions"));
        defaultPermissions.add(createPermission("Save Definitions", "DEFINITION_SAVE", "/api/definitions", "SAVE", "Save rule definitions"));

        // Rule Execution Permission
        defaultPermissions.add(createPermission("Execute Rules", "RULE_EXECUTE", "/api/execute", "EXECUTE", "Execute rule packages"));

        // Variable Management Permissions
        defaultPermissions.add(createPermission("View Variables", "VARIABLE_READ", "/api/variables", "READ", "View rule variables"));
        defaultPermissions.add(createPermission("Create Variable", "VARIABLE_CREATE", "/api/variables", "CREATE", "Create new variables"));
        defaultPermissions.add(createPermission("Update Variable", "VARIABLE_UPDATE", "/api/variables", "UPDATE", "Update variables"));
        defaultPermissions.add(createPermission("Delete Variable", "VARIABLE_DELETE", "/api/variables", "DELETE", "Delete variables"));

        // Permission Management Permissions
        defaultPermissions.add(createPermission("View Permissions", "PERMISSION_READ", "/api/permissions", "READ", "View permission list"));
        defaultPermissions.add(createPermission("Assign Permissions", "PERMISSION_ASSIGN", "/api/permissions", "ASSIGN", "Assign permissions to roles"));

        for (SysPermission permission : defaultPermissions) {
            SysPermission existing = permissionMapper.selectByCode(permission.getCode());
            if (existing == null) {
                permissionMapper.insert(permission);
                log.info("Created permission: {}", permission.getName());
            } else {
                log.debug("Permission already exists: {}", permission.getName());
            }
        }
    }

    /**
     * Assign permissions to roles
     */
    private void assignPermissionsToRoles() {
        // Admin gets all permissions
        SysRole adminRole = roleMapper.selectByCode("ADMIN");
        
        if (adminRole != null) {
            List<SysPermission> allPermissions = permissionMapper.selectList(null);
            for (SysPermission permission : allPermissions) {
                if (!rolePermissionExists(adminRole.getId(), permission.getId())) {
                    insertRolePermission(adminRole.getId(), permission.getId());
                    log.debug("Assigned permission {} to ADMIN role", permission.getCode());
                }
            }
            log.info("Assigned {} permissions to Administrator role", allPermissions.size());
        }

        // Rule Manager gets rule-related permissions
        SysRole ruleManagerRole = roleMapper.selectByCode("RULE_MANAGER");
        
        if (ruleManagerRole != null) {
            List<String> ruleManagerPermissions = Arrays.asList(
                "FEATURE_READ", "FEATURE_CREATE", "FEATURE_UPDATE", "FEATURE_DELETE",
                "PACKAGE_READ", "PACKAGE_CREATE", "PACKAGE_UPDATE", "PACKAGE_DELETE", 
                "PACKAGE_PUBLISH", "PACKAGE_TEST", "PACKAGE_OFFLINE",
                "PACKAGE_VERSION_READ", "PACKAGE_VERSION_ROLLBACK",
                "VARIABLE_READ", "VARIABLE_CREATE", "VARIABLE_UPDATE", "VARIABLE_DELETE",
                "RULE_EXECUTE",
                "RECORD_READ",
                "DEFINITION_READ", "DEFINITION_SAVE"
            );
            assignPermissionsByCode(ruleManagerRole, ruleManagerPermissions);
            log.info("Assigned {} permissions to Rule Manager role", ruleManagerPermissions.size());
        }

        // Viewer gets read-only permissions
        SysRole viewerRole = roleMapper.selectByCode("VIEWER");
        
        if (viewerRole != null) {
            List<String> viewerPermissions = Arrays.asList(
                "FEATURE_READ", 
                "PACKAGE_READ", 
                "VARIABLE_READ",
                "RULE_EXECUTE",
                "RECORD_READ",
                "DEFINITION_READ",
                "PACKAGE_VERSION_READ"
            );
            assignPermissionsByCode(viewerRole, viewerPermissions);
            log.info("Assigned {} permissions to Viewer role", viewerPermissions.size());
        }
    }

    /**
     * Assign permissions to a role by permission codes
     */
    private void assignPermissionsByCode(SysRole role, List<String> permissionCodes) {
        for (String code : permissionCodes) {
            SysPermission permission = permissionMapper.selectByCode(code);
            
            if (permission != null && !rolePermissionExists(role.getId(), permission.getId())) {
                insertRolePermission(role.getId(), permission.getId());
            }
        }
    }

    /**
     * Check if role-permission mapping exists
     */
    private boolean rolePermissionExists(Long roleId, Long permissionId) {
        return rolePermissionMapper.countByRoleAndPermission(roleId, permissionId) > 0;
    }

    /**
     * Insert role-permission mapping
     */
    private void insertRolePermission(Long roleId, Long permissionId) {
        SysRolePermission rolePermission = new SysRolePermission();
        rolePermission.setRoleId(roleId);
        rolePermission.setPermissionId(permissionId);
        rolePermissionMapper.insert(rolePermission);
    }

    /**
     * Helper method to create a Role object
     */
    private SysRole createRole(String name, String code, String description) {
        SysRole role = new SysRole();
        role.setName(name);
        role.setCode(code);
        role.setDescription(description);
        return role;
    }

    /**
     * Helper method to create a Permission object
     */
    private SysPermission createPermission(String name, String code, String resource, String action, String description) {
        SysPermission permission = new SysPermission();
        permission.setName(name);
        permission.setCode(code);
        permission.setResource(resource);
        permission.setAction(action);
        permission.setDescription(description);
        return permission;
    }
}
