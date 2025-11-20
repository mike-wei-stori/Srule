-- Database Schema for Rule Engine System

CREATE DATABASE IF NOT EXISTS `srule` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `srule`;

-- 1. Feature Management
-- Stores feature definitions (e.g., SQL queries, RPC calls)
CREATE TABLE IF NOT EXISTS `feature` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL COMMENT 'Feature Name',
    `code` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Feature Code (Identifier)',
    `type` VARCHAR(20) NOT NULL COMMENT 'Type: SQL, RPC, CONSTANT',
    `return_type` VARCHAR(50) NOT NULL COMMENT 'Return Type: STRING, INTEGER, BOOLEAN, etc.',
    `description` VARCHAR(255) COMMENT 'Description',
    `config` TEXT COMMENT 'Configuration (JSON): SQL query, RPC url, etc.',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='Feature Definitions';

-- 2. Rule Package
-- A container for a set of rules
CREATE TABLE IF NOT EXISTS `rule_package` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL COMMENT 'Package Name',
    `code` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Package Code',
    `description` VARCHAR(255) COMMENT 'Description',
    `status` VARCHAR(20) DEFAULT 'DRAFT' COMMENT 'Status: DRAFT, PUBLISHED, ARCHIVED',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='Rule Packages';

-- 3. Rule Variable (Inputs/Outputs for Packages)
-- Defines what data needs to be passed in and what comes out
CREATE TABLE IF NOT EXISTS `rule_variable` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `package_id` BIGINT NOT NULL COMMENT 'Foreign Key to Rule Package',
    `name` VARCHAR(100) NOT NULL COMMENT 'Variable Name',
    `code` VARCHAR(100) NOT NULL COMMENT 'Variable Code',
    `type` VARCHAR(50) NOT NULL COMMENT 'Data Type',
    `category` VARCHAR(20) NOT NULL COMMENT 'Category: INPUT, OUTPUT, INTERNAL',
    `feature_id` BIGINT COMMENT 'Linked Feature ID (if value comes from feature)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`package_id`) REFERENCES `rule_package`(`id`) ON DELETE CASCADE
) COMMENT='Rule Variables';

-- 4. Rule Definition
-- Stores the actual rule logic
CREATE TABLE IF NOT EXISTS `rule_definition` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `package_id` BIGINT NOT NULL COMMENT 'Foreign Key to Rule Package',
    `name` VARCHAR(100) NOT NULL COMMENT 'Rule Name',
    `priority` INT DEFAULT 0 COMMENT 'Execution Priority',
    `description` VARCHAR(255) COMMENT 'Description',
    `content_json` TEXT COMMENT 'JSON representation for Visual Editor',
    `drl_content` TEXT COMMENT 'Generated Drools DRL code',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`package_id`) REFERENCES `rule_package`(`id`) ON DELETE CASCADE
) COMMENT='Rule Definitions';

-- 5. Rule Execution Log (Optional, for debugging)
CREATE TABLE IF NOT EXISTS `rule_execution_log` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `package_code` VARCHAR(100) NOT NULL,
    `input_params` TEXT,
    `output_result` TEXT,
    `execution_time_ms` BIGINT,
    `executed_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT='Execution Logs';

-- 6. Authentication & RBAC
CREATE TABLE IF NOT EXISTS `sys_user` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `nickname` VARCHAR(100) COMMENT 'User Nickname for Display',
    `password` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='System Users';

CREATE TABLE IF NOT EXISTS `sys_role` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `description` VARCHAR(255),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT='System Roles';

CREATE TABLE IF NOT EXISTS `sys_user_role` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `role_id` BIGINT NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `sys_user`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`role_id`) REFERENCES `sys_role`(`id`) ON DELETE CASCADE
) COMMENT='User Role Mapping';

-- 7. Permission System
CREATE TABLE IF NOT EXISTS `sys_permission` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Permission Name',
    `code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Permission Code',
    `resource` VARCHAR(100) NOT NULL COMMENT 'Resource Path (e.g., /api/users)',
    `action` VARCHAR(20) NOT NULL COMMENT 'Action (READ, CREATE, UPDATE, DELETE)',
    `description` VARCHAR(255),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT='System Permissions';

CREATE TABLE IF NOT EXISTS `sys_role_permission` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `role_id` BIGINT NOT NULL,
    `permission_id` BIGINT NOT NULL,
    FOREIGN KEY (`role_id`) REFERENCES `sys_role`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`permission_id`) REFERENCES `sys_permission`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_role_permission` (`role_id`, `permission_id`)
) COMMENT='Role Permission Mapping';

-- 8. Initialize Default Roles
INSERT INTO `sys_role` (`name`, `code`, `description`) VALUES
('Administrator', 'ADMIN', 'Full system access with all permissions'),
('Rule Manager', 'RULE_MANAGER', 'Can manage rules, packages, and features'),
('Viewer', 'VIEWER', 'Read-only access to view rules and packages')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 9. Initialize Permissions
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

-- Rule Execution
('Execute Rules', 'RULE_EXECUTE', '/api/execute', 'EXECUTE', 'Execute rule packages')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 10. Assign Permissions to Roles
-- Admin gets all permissions
INSERT INTO `sys_role_permission` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `sys_role` r, `sys_permission` p WHERE r.code = 'ADMIN'
ON DUPLICATE KEY UPDATE `role_id`=VALUES(`role_id`);

-- Rule Manager gets rule-related permissions
INSERT INTO `sys_role_permission` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `sys_role` r, `sys_permission` p 
WHERE r.code = 'RULE_MANAGER' 
AND p.code IN (
    'FEATURE_READ', 'FEATURE_CREATE', 'FEATURE_UPDATE', 'FEATURE_DELETE',
    'PACKAGE_READ', 'PACKAGE_CREATE', 'PACKAGE_UPDATE', 'PACKAGE_DELETE', 'PACKAGE_PUBLISH', 'PACKAGE_TEST',
    'RULE_EXECUTE'
)
ON DUPLICATE KEY UPDATE `role_id`=VALUES(`role_id`);

-- Viewer gets read-only permissions
INSERT INTO `sys_role_permission` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `sys_role` r, `sys_permission` p 
WHERE r.code = 'VIEWER' 
AND p.code IN ('FEATURE_READ', 'PACKAGE_READ', 'RULE_EXECUTE')
ON DUPLICATE KEY UPDATE `role_id`=VALUES(`role_id`);

-- 11. Create Default Admin User (password: admin123, BCrypt hashed)
INSERT INTO `sys_user` (`username`, `nickname`, `password`, `email`) VALUES 
('admin', '系统管理员', '$2a$10$7JB720yubVSZv5W8vNGkarOu8wR0BiMhfXAm.9.j.j.j.j.j.j.j', 'admin@example.com')
ON DUPLICATE KEY UPDATE `username`=VALUES(`username`);

-- 12. Assign Admin Role to Admin User
INSERT INTO `sys_user_role` (`user_id`, `role_id`)
SELECT u.id, r.id FROM `sys_user` u, `sys_role` r 
WHERE u.username = 'admin' AND r.code = 'ADMIN'
ON DUPLICATE KEY UPDATE `user_id`=VALUES(`user_id`);
