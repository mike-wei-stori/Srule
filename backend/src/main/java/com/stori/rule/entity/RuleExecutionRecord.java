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
@TableName("rule_execution_record")
@Table(value = "rule_execution_record", comment = "规则执行记录表")
public class RuleExecutionRecord {
    @ColumnId(mode = IdType.AUTO)
    private Long id;

    @Column(value = "req_id", length = 64, notNull = true, comment = "请求ID")
    private String reqId;

    @Column(value = "package_code", length = 100, notNull = true, comment = "规则包编码")
    private String packageCode;

    @Column(value = "input_params", type = "TEXT", comment = "输入参数(JSON)")
    private String inputParams;

    @Column(value = "output_result", type = "TEXT", comment = "输出结果(JSON)")
    private String outputResult;

    @Column(value = "execution_time_ms", comment = "执行耗时(ms)")
    private Long executionTimeMs;

    @Column(value = "status", length = 20, comment = "状态: SUCCESS, FAIL")
    private String status;

    @Column(value = "error_message", type = "TEXT", comment = "错误信息")
    private String errorMessage;

    @TableField(fill = FieldFill.INSERT)
    @Column(value = "created_at", comment = "创建时间")
    private LocalDateTime createdAt;
}
