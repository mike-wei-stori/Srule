package com.stori.rule.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableName;
import org.dromara.mpe.autotable.annotation.Table;
import org.dromara.mpe.autotable.annotation.Column;
import org.dromara.mpe.autotable.annotation.ColumnId;
import lombok.Data;

@Data
@TableName("sys_user_role")
@Table(value = "sys_user_role", comment = "用户角色关联表")
public class SysUserRole {
    @ColumnId(mode = IdType.AUTO)
    private Long id;
    
    @Column(value = "user_id", notNull = true, comment = "用户ID")
    private Long userId;
    
    @Column(value = "role_id", notNull = true, comment = "角色ID")
    private Long roleId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getRoleId() { return roleId; }
    public void setRoleId(Long roleId) { this.roleId = roleId; }
}
