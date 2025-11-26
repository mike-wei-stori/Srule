-- Roles and Permissions Initialization Script
-- This script initializes default roles and permissions if they don't exist
-- Can be run manually or automatically on application startup

USE `srule`;

-- Initialize Default Roles
INSERT INTO `sys_role` (`name`, `code`, `description`) VALUES
('Administrator', 'ADMIN', 'Full system access with all permissions'),
('Rule Manager', 'RULE_MANAGER', 'Can manage rules, packages, and features'),
('Viewer', 'VIEWER', 'Read-only access to view rules and packages')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Initialize Permissions
INSERT INTO `sys_permission` (`name`, `code`, `resource`, `action`, `description`) VALUES
-- User Management
('View Users', 'USER_READ', '/api/users', 'READ', 'View user list and details'),
('Create User', 'USER_CREATE', '/api/users', 'CREATE', 'Create new users'),
('Update User', 'USER_UPDATE', '/api/users', 'UPDATE', 'Update user information'),
('Delete User', 'USER_DELETE', '/api/users', 'DELETE', 'Delete users'),

-- Role Management
('View Roles', 'ROLE_READ', '/api/roles', 'READ', 'View role list and details'),
('Create Role', 'ROLE_CREATE', '/api/roles', 'CREATE', 'Create new roles'),
('Update Role', 'ROLE_UPDATE', '/api/roles', 'UPDATE', 'Update role information'),
('Delete Role', 'ROLE_DELETE', '/api/roles', 'DELETE', 'Delete roles'),

-- Feature Management
('View Features', 'FEATURE_READ', '/api/features', 'READ', 'View feature list and details'),
('Create Feature', 'FEATURE_CREATE', '/api/features', 'CREATE', 'Create new features'),
('Update Feature', 'FEATURE_UPDATE', '/api/features', 'UPDATE', 'Update feature configuration'),
('Delete Feature', 'FEATURE_DELETE', '/api/features', 'DELETE', 'Delete features'),

-- Rule Package Management
('View Packages', 'PACKAGE_READ', '/api/packages', 'READ', 'View rule packages'),
('Create Package', 'PACKAGE_CREATE', '/api/packages', 'CREATE', 'Create new rule packages'),
('Update Package', 'PACKAGE_UPDATE', '/api/packages', 'UPDATE', 'Update rule packages'),
('Delete Package', 'PACKAGE_DELETE', '/api/packages', 'DELETE', 'Delete rule packages'),
('Publish Package', 'PACKAGE_PUBLISH', '/api/packages', 'PUBLISH', 'Publish rule packages'),
('Test Package', 'PACKAGE_TEST', '/api/packages', 'TEST', 'Test rule packages'),
('Offline Package', 'PACKAGE_OFFLINE', '/api/packages', 'OFFLINE', 'Offline rule packages'),

-- Package Version Management
('View Versions', 'PACKAGE_VERSION_READ', '/api/packages/versions', 'READ', 'View package versions'),
('Rollback Version', 'PACKAGE_VERSION_ROLLBACK', '/api/packages/versions', 'ROLLBACK', 'Rollback to version'),

-- Record Management
('View Records', 'RECORD_READ', '/api/records', 'READ', 'View execution records'),

-- Rule Definition Management
('View Definitions', 'DEFINITION_READ', '/api/definitions', 'READ', 'View rule definitions'),
('Save Definitions', 'DEFINITION_SAVE', '/api/definitions', 'SAVE', 'Save rule definitions'),

-- Rule Execution
('Execute Rules', 'RULE_EXECUTE', '/api/execute', 'EXECUTE', 'Execute rule packages'),

-- Variable Management
('View Variables', 'VARIABLE_READ', '/api/variables', 'READ', 'View rule variables'),
('Create Variable', 'VARIABLE_CREATE', '/api/variables', 'CREATE', 'Create new variables'),
('Update Variable', 'VARIABLE_UPDATE', '/api/variables', 'UPDATE', 'Update variables'),
('Delete Variable', 'VARIABLE_DELETE', '/api/variables', 'DELETE', 'Delete variables'),

-- Permission Management
('View Permissions', 'PERMISSION_READ', '/api/permissions', 'READ', 'View permission list'),
('Assign Permissions', 'PERMISSION_ASSIGN', '/api/permissions', 'ASSIGN', 'Assign permissions to roles')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Assign All Permissions to Admin Role
INSERT INTO `sys_role_permission` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `sys_role` r, `sys_permission` p WHERE r.code = 'ADMIN'
ON DUPLICATE KEY UPDATE `role_id`=VALUES(`role_id`);

-- Assign Rule-Related Permissions to Rule Manager
INSERT INTO `sys_role_permission` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `sys_role` r, `sys_permission` p 
WHERE r.code = 'RULE_MANAGER' 
AND p.code IN (
    'FEATURE_READ', 'FEATURE_CREATE', 'FEATURE_UPDATE', 'FEATURE_DELETE',
    'PACKAGE_READ', 'PACKAGE_CREATE', 'PACKAGE_UPDATE', 'PACKAGE_DELETE', 'PACKAGE_PUBLISH', 'PACKAGE_TEST', 'PACKAGE_OFFLINE',
    'PACKAGE_VERSION_READ', 'PACKAGE_VERSION_ROLLBACK',
    'VARIABLE_READ', 'VARIABLE_CREATE', 'VARIABLE_UPDATE', 'VARIABLE_DELETE',
    'RULE_EXECUTE',
    'RECORD_READ',
    'DEFINITION_READ', 'DEFINITION_SAVE'
)
ON DUPLICATE KEY UPDATE `role_id`=VALUES(`role_id`);

-- Assign Read-Only Permissions to Viewer
INSERT INTO `sys_role_permission` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `sys_role` r, `sys_permission` p 
WHERE r.code = 'VIEWER' 
AND p.code IN ('FEATURE_READ', 'PACKAGE_READ', 'VARIABLE_READ', 'RULE_EXECUTE', 'RECORD_READ', 'DEFINITION_READ', 'PACKAGE_VERSION_READ')
ON DUPLICATE KEY UPDATE `role_id`=VALUES(`role_id`);
