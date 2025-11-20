import React, { useRef } from 'react';
import { PageContainer, ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import { request, useIntl } from '@umijs/max';
import { getPermissions } from '@/services/PermissionController';

const PermissionManagement: React.FC = () => {
    const actionRef = useRef<ActionType>();
    const intl = useIntl();

    const columns: ProColumns<API.Permission>[] = [
        {
            title: intl.formatMessage({ id: 'pages.permission.id' }),
            dataIndex: 'id',
            width: 80,
            search: false,
        },
        {
            title: intl.formatMessage({ id: 'pages.permission.name' }),
            dataIndex: 'name',
            copyable: true,
        },
        {
            title: intl.formatMessage({ id: 'pages.permission.code' }),
            dataIndex: 'code',
            render: (_, record) => <Tag color="blue">{record.code}</Tag>,
        },
        {
            title: intl.formatMessage({ id: 'pages.permission.resource' }),
            dataIndex: 'resource',
        },
        {
            title: intl.formatMessage({ id: 'pages.permission.action' }),
            dataIndex: 'action',
            valueType: 'select',
            valueEnum: {
                READ: { text: 'READ', status: 'Success' },
                CREATE: { text: 'CREATE', status: 'Processing' },
                UPDATE: { text: 'UPDATE', status: 'Warning' },
                DELETE: { text: 'DELETE', status: 'Error' },
                EXECUTE: { text: 'EXECUTE', status: 'Default' },
            },
        },
        {
            title: intl.formatMessage({ id: 'pages.permission.description' }),
            dataIndex: 'description',
            search: false,
            ellipsis: true,
        },
    ];

    return (
        <PageContainer>
            <ProTable<API.Permission>
                headerTitle={intl.formatMessage({ id: 'menu.permissions' })}
                actionRef={actionRef}
                rowKey="id"
                search={{
                    labelWidth: 'auto',
                }}
                request={async (params) => {
                    const res = await getPermissions(params);
                    return {
                        data: (res.data as API.Permission[]) || [],
                        success: true,
                    };
                }}
                columns={columns}
                pagination={{
                    pageSize: 20,
                }}
            />
        </PageContainer>
    );
};

export default PermissionManagement;
