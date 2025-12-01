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
@TableName("rule_package")
@Table(value = "rule_package", comment = "规则包表")
public class RulePackage {
    @ColumnId(mode = IdType.AUTO)
    private Long id;
    
    @Column(value = "name", length = 100, notNull = true, comment = "规则包名称")
    private String name;
    
    @Column(value = "code", length = 100, notNull = true, comment = "规则包编码")
    private String code;
    
    @Column(value = "description", length = 255, comment = "描述")
    private String description;
    
    @Column(value = "status", length = 20, defaultValue = "DRAFT", comment = "状态: DRAFT, PUBLISHED, ARCHIVED")
    private String status;

    @Column(value = "active_version_id", comment = "当前激活的版本ID")
    private Long activeVersionId;

    @Column(value = "extension_data", type = "text", comment = "扩展数据(JSON)")
    private String extensionData;

    @Column(value = "tenant_id", length = 50, defaultValue = "DEFAULT", comment = "租户ID")
    private String tenantId;

    @Column(value = "owner", length = 255, comment = "负责人")
    private String owner;

    @TableField(fill = FieldFill.INSERT)
    @Column(value = "created_by", length = 50, comment = "创建人")
    private String createdBy;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    @Column(value = "last_modified_by", length = 50, comment = "最后修改人")
    private String lastModifiedBy;
    
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

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getActiveVersionId() { return activeVersionId; }
    public void setActiveVersionId(Long activeVersionId) { this.activeVersionId = activeVersionId; }

    public String getExtensionData() { return extensionData; }
    public void setExtensionData(String extensionData) { this.extensionData = extensionData; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getLastModifiedBy() { return lastModifiedBy; }
    public void setLastModifiedBy(String lastModifiedBy) { this.lastModifiedBy = lastModifiedBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
