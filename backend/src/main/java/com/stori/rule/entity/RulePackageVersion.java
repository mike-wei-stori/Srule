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
@TableName("rule_package_version")
@Table(value = "rule_package_version", comment = "规则包版本表")
public class RulePackageVersion {
    @ColumnId(mode = IdType.AUTO)
    private Long id;
    
    @Column(value = "package_id", notNull = true, comment = "规则包ID")
    private Long packageId;
    
    @Column(value = "version", length = 20, notNull = true, comment = "版本号")
    private String version;
    
    @Column(value = "description", length = 255, comment = "版本描述")
    private String description;
    
    @Column(value = "content_json", type = "TEXT", comment = "规则图快照")
    private String contentJson;
    
    @TableField(fill = FieldFill.INSERT)
    @Column(value = "created_at", comment = "创建时间")
    private LocalDateTime createdAt;
    
    @Column(value = "created_by", length = 50, comment = "创建人")
    private String createdBy;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPackageId() { return packageId; }
    public void setPackageId(Long packageId) { this.packageId = packageId; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getContentJson() { return contentJson; }
    public void setContentJson(String contentJson) { this.contentJson = contentJson; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
