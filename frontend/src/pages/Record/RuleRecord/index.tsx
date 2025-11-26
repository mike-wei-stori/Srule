import { listRuleRecords } from '@/services/RecordController';
import { PageContainer, ProTable, ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import React from 'react';

const RuleRecordList: React.FC = () => {
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
            title: 'Package Code',
            dataIndex: 'packageCode',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            valueEnum: {
                SUCCESS: { text: 'Success', status: 'Success' },
                FAIL: { text: 'Fail', status: 'Error' },
            },
            render: (_, record) => (
                <Tag color={record.status === 'SUCCESS' ? 'success' : 'error'}>
                    {record.status}
                </Tag>
            ),
        },
        {
            title: 'Execution Time (ms)',
            dataIndex: 'executionTimeMs',
            search: false,
            sorter: true,
        },
        {
            title: 'Input Params',
            dataIndex: 'inputParams',
            search: false,
            ellipsis: true,
            copyable: true,
        },
        {
            title: 'Output Result',
            dataIndex: 'outputResult',
            search: false,
            ellipsis: true,
            copyable: true,
        },
        {
            title: 'Error Message',
            dataIndex: 'errorMessage',
            search: false,
            ellipsis: true,
            hideInTable: true,
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
                headerTitle="Rule Execution Records"
                rowKey="id"
                search={{
                    labelWidth: 'auto',
                }}
                request={async (params, sort) => {
                    const msg = await listRuleRecords({
                        current: params.current,
                        pageSize: params.pageSize,
                        reqId: params.reqId,
                        packageCode: params.packageCode,
                        status: params.status,
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

export default RuleRecordList;
