package com.stori.rule.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableName;
import org.dromara.mpe.autotable.annotation.Table;
import org.dromara.mpe.autotable.annotation.Column;
import org.dromara.mpe.autotable.annotation.ColumnId;
import lombok.Data;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import java.time.LocalDateTime;

@Data
@TableName("sys_permission")
@Table(value = "sys_permission", comment = "系统权限表")
public class SysPermission {
    @ColumnId(mode = IdType.AUTO)
    private Long id;
    
    @Column(value = "name", length = 50, notNull = true, comment = "权限名称")
    private String name;
    
    @Column(value = "code", length = 50, notNull = true, comment = "权限编码")
    private String code;
    
    @Column(value = "resource", length = 100, notNull = true, comment = "资源路径")
    private String resource;
    
    @Column(value = "action", length = 20, notNull = true, comment = "操作类型")
    private String action;
    
    @Column(value = "description", length = 255, comment = "权限描述")
    private String description;
    
    @TableField(fill = FieldFill.INSERT)
    @Column(value = "created_at", comment = "创建时间")
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getResource() { return resource; }
    public void setResource(String resource) { this.resource = resource; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
