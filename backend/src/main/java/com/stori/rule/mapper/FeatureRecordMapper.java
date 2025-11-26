package com.stori.rule.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.stori.rule.entity.FeatureRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface FeatureRecordMapper extends BaseMapper<FeatureRecord> {
    Page<FeatureRecord> selectPageByCondition(Page<FeatureRecord> page, @Param("reqId") String reqId, @Param("featureName") String featureName);
}
