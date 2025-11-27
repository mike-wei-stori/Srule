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
@TableName("rule_definition")
@Table(value = "rule_definition", comment = "规则定义表")
public class RuleDefinition {
    @ColumnId(mode = IdType.AUTO)
    private Long id;
    
    @Column(value = "package_id", notNull = true, comment = "规则包ID")
    private Long packageId;
    
    @Column(value = "name", length = 100, notNull = true, comment = "规则名称")
    private String name;
    
    @Column(value = "priority", defaultValue = "0", comment = "执行优先级")
    private Integer priority;
    
    @Column(value = "description", length = 255, comment = "描述")
    private String description;
    
    @Column(value = "content_json", type = "TEXT", comment = "可视化编辑器JSON")
    private String contentJson;
    
    @Column(value = "drl_content", type = "TEXT", comment = "生成的DRL代码")
    private String drlContent;

    @Column(value = "tenant_id", length = 50, defaultValue = "DEFAULT", comment = "租户ID")
    private String tenantId;
    
    @TableField(fill = FieldFill.INSERT)
    @Column(value = "created_at", comment = "创建时间")
    private LocalDateTime createdAt;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    @Column(value = "updated_at", comment = "更新时间")
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPackageId() { return packageId; }
    public void setPackageId(Long packageId) { this.packageId = packageId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getPriority() { return priority; }
    public void setPriority(Integer priority) { this.priority = priority; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getContentJson() { return contentJson; }
    public void setContentJson(String contentJson) { this.contentJson = contentJson; }

    public String getDrlContent() { return drlContent; }
    public void setDrlContent(String drlContent) { this.drlContent = drlContent; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
