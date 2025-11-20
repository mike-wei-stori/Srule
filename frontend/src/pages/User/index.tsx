import React, { useRef } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { PageContainer, ActionType, ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, message, Popconfirm } from 'antd';
import { useIntl } from '@umijs/max';
import { getUsers, createUser, updateUser, deleteUser } from '@/services/UserController';

type SysUser = {
    id: number;
    username: string;
    email: string;
    phone: string;
    roleId: number;
    createTime: string;
};

const UserList: React.FC = () => {
    const actionRef = useRef<ActionType>();
    const intl = useIntl();

    const columns: ProColumns<SysUser>[] = [
        {
            title: intl.formatMessage({ id: 'pages.login.username' }),
            dataIndex: 'username',
        },
        {
            title: intl.formatMessage({ id: 'pages.profile.email' }),
            dataIndex: 'email',
        },
        {
            title: intl.formatMessage({ id: 'pages.user.phone' }),
            dataIndex: 'phone',
        },
        {
            title: intl.formatMessage({ id: 'pages.user.roleId' }),
            dataIndex: 'roleId',
            valueType: 'select',
            valueEnum: {
                1: { text: intl.formatMessage({ id: 'pages.user.admin' }), status: 'Success' },
                2: { text: intl.formatMessage({ id: 'pages.user.manager' }), status: 'Warning' },
                3: { text: intl.formatMessage({ id: 'pages.user.viewer' }), status: 'Default' },
            },
        },
        {
            title: intl.formatMessage({ id: 'common.actions' }),
            valueType: 'option',
            render: (text, record, _, action) => [
                <a
                    key="editable"
                    onClick={() => {
                        action?.startEditable?.(record.id);
                    }}
                >
                    {intl.formatMessage({ id: 'common.edit' })}
                </a>,
                <Popconfirm
                    key="delete"
                    title={intl.formatMessage({ id: 'message.deleteConfirm' })}
                    onConfirm={async () => {
                        await deleteUser(record.id);
                        message.success(intl.formatMessage({ id: 'common.success' }));
                        actionRef.current?.reload();
                    }}
                >
                    <a>{intl.formatMessage({ id: 'common.delete' })}</a>
                </Popconfirm>,
            ],
        },
    ];

    return (
        <PageContainer>
            <ProTable<SysUser>
                headerTitle={intl.formatMessage({ id: 'menu.users' })}
                actionRef={actionRef}
                rowKey="id"
                search={{
                    labelWidth: 'auto',
                }}
                toolBarRender={() => [
                    <Button
                        type="primary"
                        key="primary"
                        onClick={() => {
                            actionRef.current?.addEditRecord?.({
                                id: (Math.random() * 1000000).toFixed(0),
                            });
                        }}
                    >
                        <PlusOutlined /> {intl.formatMessage({ id: 'common.create' })}
                    </Button>,
                ]}
                request={async (params) => {
                    const result = await getUsers(params);
                    return {
                        data: (result.data as SysUser[]) || [],
                        success: true,
                        total: (result.data as SysUser[])?.length || 0,
                    };
                }}
                editable={{
                    type: 'multiple',
                    onSave: async (key, row) => {
                        if (typeof row.id === 'string') {
                            await createUser(row);
                        } else {
                            await updateUser(row.id, row);
                        }
                        message.success(intl.formatMessage({ id: 'common.success' }));
                    },
                }}
                columns={columns}
            />
        </PageContainer>
    );
};

export default UserList;
