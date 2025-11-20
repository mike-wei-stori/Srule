package com.stori.rule.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableName;
import org.dromara.mpe.autotable.annotation.Table;
import org.dromara.mpe.autotable.annotation.Column;
import org.dromara.mpe.autotable.annotation.ColumnId;
import lombok.Data;

@Data
@TableName("sys_role_permission")
@Table(value = "sys_role_permission", comment = "角色权限关联表")
public class SysRolePermission {
    @ColumnId(mode = IdType.AUTO)
    private Long id;
    
    @Column(value = "role_id", notNull = true, comment = "角色ID")
    private Long roleId;
    
    @Column(value = "permission_id", notNull = true, comment = "权限ID")
    private Long permissionId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getRoleId() { return roleId; }
    public void setRoleId(Long roleId) { this.roleId = roleId; }

    public Long getPermissionId() { return permissionId; }
    public void setPermissionId(Long permissionId) { this.permissionId = permissionId; }
}
