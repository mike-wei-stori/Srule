# 数据库初始化说明

## 概述

本系统提供了两种方式来初始化角色和权限数据：

1. **自动初始化**（推荐）：应用启动时自动执行
2. **手动初始化**：运行 SQL 脚本

## 方式一：自动初始化（推荐）

### 工作原理

系统包含一个 `DatabaseInitializer` 组件，它会在应用启动时自动执行以下操作：

1. 检查并创建默认角色（如果不存在）
   - Administrator (ADMIN)
   - Rule Manager (RULE_MANAGER)
   - Viewer (VIEWER)

2. 检查并创建默认权限（如果不存在）
   - 用户管理权限
   - 角色管理权限
   - 功能管理权限
   - 规则包管理权限
   - 规则执行权限
   - 变量管理权限
   - 权限管理权限

3. 为角色分配相应的权限
   - Admin：所有权限
   - Rule Manager：规则相关权限
   - Viewer：只读权限

### 使用方法

无需任何操作！只需启动应用，初始化会自动完成。

### 日志输出

启动时会看到类似以下的日志：

```
INFO  c.s.r.config.DatabaseInitializer - Starting database initialization...
INFO  c.s.r.config.DatabaseInitializer - Created role: Administrator
INFO  c.s.r.config.DatabaseInitializer - Created permission: View Users
...
INFO  c.s.r.config.DatabaseInitializer - Assigned 25 permissions to Administrator role
INFO  c.s.r.config.DatabaseInitializer - Database initialization completed successfully
```

### 特性

- **幂等性**：多次运行不会创建重复数据
- **安全性**：使用事务保证数据一致性
- **容错性**：初始化失败不会影响应用启动

## 方式二：手动 SQL 初始化

如果需要手动初始化或重新初始化，可以运行 SQL 脚本。

### 脚本位置

```
backend/src/main/resources/db/init-roles-permissions.sql
```

### 执行方法

#### 方法 1：使用 MySQL 客户端

```bash
mysql -u root -p srule < backend/src/main/resources/db/init-roles-permissions.sql
```

#### 方法 2：在 MySQL Workbench 或其他工具中执行

1. 打开 `init-roles-permissions.sql` 文件
2. 连接到 `srule` 数据库
3. 执行整个脚本

### 脚本特性

- 使用 `ON DUPLICATE KEY UPDATE` 避免重复插入
- 可以安全地多次执行
- 与自动初始化逻辑保持一致

## 默认角色说明

### Administrator (ADMIN)
- **描述**：系统管理员，拥有所有权限
- **权限**：全部 25+ 个权限
- **用途**：系统管理、用户管理、完整的规则管理

### Rule Manager (RULE_MANAGER)
- **描述**：规则管理员，可以管理规则、包和功能
- **权限**：
  - 功能管理（增删改查）
  - 规则包管理（增删改查、发布、测试）
  - 变量管理（增删改查）
  - 规则执行
- **用途**：日常规则配置和管理

### Viewer (VIEWER)
- **描述**：只读用户，可以查看规则和执行规则
- **权限**：
  - 查看功能
  - 查看规则包
  - 查看变量
  - 执行规则
- **用途**：规则查看和测试

## 权限列表

### 用户管理 (USER_*)
- USER_READ：查看用户
- USER_CREATE：创建用户
- USER_UPDATE：更新用户
- USER_DELETE：删除用户

### 角色管理 (ROLE_*)
- ROLE_READ：查看角色
- ROLE_CREATE：创建角色
- ROLE_UPDATE：更新角色
- ROLE_DELETE：删除角色

### 功能管理 (FEATURE_*)
- FEATURE_READ：查看功能
- FEATURE_CREATE：创建功能
- FEATURE_UPDATE：更新功能
- FEATURE_DELETE：删除功能

### 规则包管理 (PACKAGE_*)
- PACKAGE_READ：查看规则包
- PACKAGE_CREATE：创建规则包
- PACKAGE_UPDATE：更新规则包
- PACKAGE_DELETE：删除规则包
- PACKAGE_PUBLISH：发布规则包
- PACKAGE_TEST：测试规则包

### 变量管理 (VARIABLE_*)
- VARIABLE_READ：查看变量
- VARIABLE_CREATE：创建变量
- VARIABLE_UPDATE：更新变量
- VARIABLE_DELETE：删除变量

### 规则执行 (RULE_*)
- RULE_EXECUTE：执行规则

### 权限管理 (PERMISSION_*)
- PERMISSION_READ：查看权限
- PERMISSION_ASSIGN：分配权限

## 自定义初始化

如果需要添加新的角色或权限，可以修改：

1. **Java 代码方式**：编辑 `DatabaseInitializer.java`
   - 在 `initializeRoles()` 中添加新角色
   - 在 `initializePermissions()` 中添加新权限
   - 在 `assignPermissionsToRoles()` 中配置权限分配

2. **SQL 脚本方式**：编辑 `init-roles-permissions.sql`
   - 添加新的 INSERT 语句

## 故障排除

### 问题：初始化失败

**检查项**：
1. 数据库连接是否正常
2. 数据库表是否已创建（运行 schema.sql）
3. 查看应用日志中的错误信息

### 问题：权限没有生效

**解决方案**：
1. 检查用户是否已分配角色
2. 检查角色是否已分配权限
3. 重新登录以刷新权限缓存

### 问题：重复数据

**说明**：
- 初始化逻辑已处理重复情况
- 使用 `ON DUPLICATE KEY UPDATE` 避免重复
- 可以安全地多次运行

## 注意事项

1. **首次启动**：确保数据库已创建并运行了 schema.sql
2. **生产环境**：建议在首次部署时手动检查初始化结果
3. **权限修改**：修改默认权限后需要重启应用
4. **数据备份**：修改权限配置前建议备份数据库

## 相关文件

- `backend/src/main/java/com/stori/rule/config/DatabaseInitializer.java` - 自动初始化组件
- `backend/src/main/resources/db/init-roles-permissions.sql` - SQL 初始化脚本
- `backend/schema.sql` - 完整数据库架构（包含初始化数据）
