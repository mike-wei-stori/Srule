package com.stori.rule.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import org.dromara.mpe.autotable.annotation.Column;
import org.dromara.mpe.autotable.annotation.ColumnId;
import org.dromara.mpe.autotable.annotation.Table;

import java.time.LocalDateTime;

@Data
@TableName("sys_config")
@Table(value = "sys_config", comment = "System Configuration Table")
public class SysConfig {
    @ColumnId(mode = IdType.AUTO)
    private Long id;

    @Column(value = "config_key", length = 100, notNull = true, comment = "Config Key")
    private String configKey;

    @Column(value = "config_value", length = 1000, comment = "Config Value")
    private String configValue;

    @Column(value = "description", length = 255, comment = "Description")
    private String description;

    @TableField(fill = FieldFill.INSERT)
    @Column(value = "created_at", comment = "Created At")
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    @Column(value = "updated_at", comment = "Updated At")
    private LocalDateTime updatedAt;
}
