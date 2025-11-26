import { listFeatureRecords } from '@/services/RecordController';
import { PageContainer, ProTable, ProColumns } from '@ant-design/pro-components';
import React from 'react';

const FeatureRecordList: React.FC = () => {
    const columns: ProColumns<any>[] = [
        {
            title: 'ID',
            dataIndex: 'id',
            width: 80,
            search: false,
        },
        {
            title: 'Request ID',
            dataIndex: 'reqId',
            copyable: true,
        },
        {
            title: 'Feature Name',
            dataIndex: 'featureName',
        },
        {
            title: 'Feature Value',
            dataIndex: 'featureValue',
            search: false,
            ellipsis: true,
        },
        {
            title: 'Execution Time (ms)',
            dataIndex: 'executionTimeMs',
            search: false,
            sorter: true,
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            valueType: 'dateTime',
            search: false,
            sorter: true,
        },
    ];

    return (
        <PageContainer>
            <ProTable<any>
                headerTitle="Feature Execution Records"
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
