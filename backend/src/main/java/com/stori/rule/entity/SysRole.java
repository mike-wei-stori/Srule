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
@TableName("sys_role")
@Table(value = "sys_role", comment = "系统角色表")
public class SysRole {
    @ColumnId(mode = IdType.AUTO)
    private Long id;
    
    @Column(value = "name", length = 50, notNull = true, comment = "角色名称")
    private String name;
    
    @Column(value = "code", length = 50, notNull = true, comment = "角色编码")
    private String code;
    
    @Column(value = "description", length = 255, comment = "角色描述")
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

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
