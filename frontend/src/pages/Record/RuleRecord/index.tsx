import { listRuleRecords } from '@/services/RecordController';
import { PageContainer, ProTable, ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import React from 'react';
import { useIntl } from '@umijs/max';

const RuleRecordList: React.FC = () => {
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
            title: intl.formatMessage({ id: 'pages.records.packageCode', defaultMessage: 'Package Code' }),
            dataIndex: 'packageCode',
        },
        {
            title: intl.formatMessage({ id: 'pages.records.status', defaultMessage: 'Status' }),
            dataIndex: 'status',
            valueEnum: {
                SUCCESS: { text: intl.formatMessage({ id: 'pages.records.status.success', defaultMessage: 'Success' }), status: 'Success' },
                FAIL: { text: intl.formatMessage({ id: 'pages.records.status.fail', defaultMessage: 'Fail' }), status: 'Error' },
            },
            render: (_, record) => (
                <Tag color={record.status === 'SUCCESS' ? 'success' : 'error'}>
                    {record.status === 'SUCCESS' ? intl.formatMessage({ id: 'pages.records.status.success' }) : intl.formatMessage({ id: 'pages.records.status.fail' })}
                </Tag>
            ),
        },
        {
            title: intl.formatMessage({ id: 'pages.records.executionTime', defaultMessage: 'Execution Time (ms)' }),
            dataIndex: 'executionTimeMs',
            search: false,
            sorter: true,
        },
        {
            title: intl.formatMessage({ id: 'pages.records.inputParams', defaultMessage: 'Input Params' }),
            dataIndex: 'inputParams',
            search: false,
            ellipsis: true,
            copyable: true,
        },
        {
            title: intl.formatMessage({ id: 'pages.records.outputResult', defaultMessage: 'Output Result' }),
            dataIndex: 'outputResult',
            search: false,
            ellipsis: true,
            copyable: true,
        },
        {
            title: intl.formatMessage({ id: 'pages.records.errorMessage', defaultMessage: 'Error Message' }),
            dataIndex: 'errorMessage',
            search: false,
            ellipsis: true,
            hideInTable: true,
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
                headerTitle={intl.formatMessage({ id: 'pages.records.rule.title', defaultMessage: 'Rule Execution Records' })}
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
