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
@TableName("feature")
@Table(value = "feature", comment = "特征定义表")
public class Feature {
    @ColumnId(mode = IdType.AUTO)
    private Long id;
    
    @Column(value = "name", length = 100, notNull = true, comment = "特征名称")
    private String name;
    
    @Column(value = "code", length = 100, notNull = true, comment = "特征编码")
    private String code;
    
    @Column(value = "type", length = 20, notNull = true, comment = "类型: SQL, RPC, CONSTANT")
    private String type;
    
    @Column(value = "return_type", length = 50, notNull = true, comment = "返回类型")
    private String returnType;
    
    @Column(value = "description", length = 255, comment = "描述")
    private String description;
    
    @Column(value = "config", type = "TEXT", comment = "配置(JSON)")
    private String config;
    
    @TableField(fill = FieldFill.INSERT)
    @Column(value = "created_at", comment = "创建时间")
    private LocalDateTime createdAt;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    @Column(value = "updated_at", comment = "更新时间")
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getReturnType() { return returnType; }
    public void setReturnType(String returnType) { this.returnType = returnType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getConfig() { return config; }
    public void setConfig(String config) { this.config = config; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
