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
@TableName("feature_record")
@Table(value = "feature_record", comment = "特征执行记录表")
public class FeatureRecord {
    @ColumnId(mode = IdType.AUTO)
    private Long id;

    @Column(value = "req_id", length = 64, notNull = true, comment = "请求ID")
    private String reqId;

    @Column(value = "feature_id", comment = "特征ID")
    private Long featureId;

    @Column(value = "feature_name", length = 100, comment = "特征名称")
    private String featureName;

    @Column(value = "feature_value", type = "TEXT", comment = "特征值(JSON)")
    private String featureValue;

    @Column(value = "execution_time_ms", comment = "执行耗时(ms)")
    private Long executionTimeMs;

    @Column(value = "tenant_id", length = 50, defaultValue = "DEFAULT", comment = "租户ID")
    private String tenantId;

    @TableField(fill = FieldFill.INSERT)
    @Column(value = "created_by", length = 50, comment = "创建人")
    private String createdBy;

    @TableField(fill = FieldFill.INSERT)
    @Column(value = "created_at", comment = "创建时间")
    private LocalDateTime createdAt;
}
