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
@TableName("rule_variable")
@Table(value = "rule_variable", comment = "规则变量表")
public class RuleVariable {
    @ColumnId(mode = IdType.AUTO)
    private Long id;
    
    @Column(value = "package_id", notNull = true, comment = "规则包ID")
    private Long packageId;
    
    @Column(value = "name", length = 100, notNull = true, comment = "变量名称")
    private String name;
    
    @Column(value = "code", length = 100, notNull = true, comment = "变量编码")
    private String code;
    
    @Column(value = "type", length = 50, notNull = true, comment = "数据类型")
    private String type;
    
    @Column(value = "category", length = 20, notNull = true, comment = "类别: INPUT, OUTPUT, INTERNAL")
    private String category;
    
    @Column(value = "feature_id", comment = "关联特征ID")
    private Long featureId;
    
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

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Long getFeatureId() { return featureId; }
    public void setFeatureId(Long featureId) { this.featureId = featureId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
