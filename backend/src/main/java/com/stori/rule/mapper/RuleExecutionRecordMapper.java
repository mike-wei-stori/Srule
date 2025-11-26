package com.stori.rule.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.stori.rule.entity.RuleExecutionRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface RuleExecutionRecordMapper extends BaseMapper<RuleExecutionRecord> {
    Page<RuleExecutionRecord> selectPageByCondition(Page<RuleExecutionRecord> page, @Param("reqId") String reqId, @Param("packageCode") String packageCode, @Param("status") String status);
}
