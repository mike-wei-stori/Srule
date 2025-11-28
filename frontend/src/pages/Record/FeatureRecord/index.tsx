import { listFeatureRecords } from '@/services/RecordController';
import { PageContainer, ProTable, ProColumns } from '@ant-design/pro-components';
import React from 'react';
import { useIntl } from '@umijs/max';

const FeatureRecordList: React.FC = () => {
    const intl = useIntl();
    const columns: ProColumns<any>[] = [
        {
            title: intl.formatMessage({ id: 'pages.records.id', defaultMessage: 'ID' }),
            dataIndex: 'id',
            width: 80,
            search: false,
        },
        {
            title: intl.formatMessage({ id: 'pages.records.reqId', defaultMessage: 'Request ID' }),
            dataIndex: 'reqId',
            copyable: true,
        },
        {
            title: intl.formatMessage({ id: 'pages.records.featureName', defaultMessage: 'Feature Name' }),
            dataIndex: 'featureName',
        },
        {
            title: intl.formatMessage({ id: 'pages.records.featureValue', defaultMessage: 'Feature Value' }),
            dataIndex: 'featureValue',
            search: false,
            ellipsis: true,
        },
        {
            title: intl.formatMessage({ id: 'pages.records.executionTime', defaultMessage: 'Execution Time (ms)' }),
            dataIndex: 'executionTimeMs',
            search: false,
            sorter: true,
        },
        {
            title: intl.formatMessage({ id: 'pages.records.createdAt', defaultMessage: 'Created At' }),
            dataIndex: 'createdAt',
            valueType: 'dateTime',
            search: false,
            sorter: true,
        },
    ];

    return (
        <PageContainer>
            <ProTable<any>
                headerTitle={intl.formatMessage({ id: 'pages.records.feature.title', defaultMessage: 'Feature Execution Records' })}
                rowKey="id"
                search={{
                    labelWidth: 'auto',
                }}
                request={async (params, sort) => {
                    const msg = await listFeatureRecords({
                        current: params.current,
                        pageSize: params.pageSize,
                        reqId: params.reqId,
                        featureName: params.featureName,
                    });
                    return {
                        data: msg.data?.records || [],
                        success: msg.code === 200,
                        total: msg.data?.total || 0,
                    };
                }}
                columns={columns}
            />
        </PageContainer>
    );
};

export default FeatureRecordList;
