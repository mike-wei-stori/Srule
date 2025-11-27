import React, { useRef, useState, useEffect } from 'react';
import { PageContainer, ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Modal, Form, Input, message, Tag, Transfer } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { request, useIntl } from '@umijs/max';
import { getRoles, createRole, updateRole, deleteRole } from '@/services/RoleController';
import { getPermissions, getRolePermissions, assignPermissions } from '@/services/PermissionController';
import PermissionGate from '@/components/PermissionGate';

const RoleManagement: React.FC = () => {
    const actionRef = useRef<ActionType>();
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [permissionModalVisible, setPermissionModalVisible] = useState(false);
    const [currentRole, setCurrentRole] = useState<API.Role | null>(null);
    const [allPermissions, setAllPermissions] = useState<API.Permission[]>([]);
    const [targetKeys, setTargetKeys] = useState<string[]>([]);
    const [form] = Form.useForm();
    const intl = useIntl();

    const fetchPermissions = async () => {
        const res = await getPermissions({});
        if (res.data) {
            setAllPermissions(res.data as API.Permission[]);
        }
    };

    const fetchRolePermissions = async (roleId: number) => {
        const res = await getRolePermissions(roleId);
        if (res.data) {
            setTargetKeys((res.data as API.Permission[]).map((p: API.Permission) => String(p.id)));
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    const handleCreate = async (values: API.Role) => {
        await createRole(values);
        message.success(intl.formatMessage({ id: 'common.success' }));
        setCreateModalVisible(false);
        actionRef.current?.reload();
    };

    const handleUpdate = async (values: API.Role) => {
        if (!currentRole) return;
        await updateRole(currentRole.id, values);
        message.success(intl.formatMessage({ id: 'common.success' }));
        setEditModalVisible(false);
        actionRef.current?.reload();
    };

    const handleDelete = async (id: number) => {
        await deleteRole(id);
        message.success(intl.formatMessage({ id: 'common.success' }));
        actionRef.current?.reload();
    };

    const handleAssignPermissions = async () => {
        if (!currentRole) return;
        await assignPermissions(currentRole.id, targetKeys.map(key => Number(key)));
        message.success(intl.formatMessage({ id: 'common.success' }));
        setPermissionModalVisible(false);
    };

    const columns: ProColumns<API.Role>[] = [
        {
            title: intl.formatMessage({ id: 'pages.role.id' }),
            dataIndex: 'id',
            width: 80,
            search: false,
        },
        {
            title: intl.formatMessage({ id: 'pages.role.name' }), // Using username label for name temporarily or add role name
            dataIndex: 'name',
            copyable: true,
        },
        {
            title: intl.formatMessage({ id: 'pages.role.code' }),
            dataIndex: 'code',
            render: (_, record) => <Tag color="green">{record.code}</Tag>,
        },
        {
            title: intl.formatMessage({ id: 'pages.role.description' }),
            dataIndex: 'description',
            search: false,
            ellipsis: true,
        },
        {
            title: intl.formatMessage({ id: 'pages.role.createTime' }),
            dataIndex: 'createTime',
            valueType: 'dateTime',
            search: false,
        },
        {
            title: intl.formatMessage({ id: 'common.actions' }),
            valueType: 'option',
            render: (_, record) => [
                <PermissionGate permission="ROLE_UPDATE">
                    <a key="edit" onClick={() => {
                        setCurrentRole(record);
                        form.setFieldsValue(record);
                        setEditModalVisible(true);
                    }}>
                        {intl.formatMessage({ id: 'common.edit' })}
                    </a>
                </PermissionGate>,
                <PermissionGate permission="PERMISSION_ASSIGN">
                    <a key="permissions" onClick={() => {
                        setCurrentRole(record);
                        fetchRolePermissions(record.id);
                        setPermissionModalVisible(true);
                    }}>
                        {intl.formatMessage({ id: 'pages.role.permissions' })}
                    </a>
                </PermissionGate>,
                <PermissionGate permission="ROLE_DELETE">
                    <a key="delete" className="text-red-500" onClick={() => handleDelete(record.id)}>
                        {intl.formatMessage({ id: 'common.delete' })}
                    </a>
                </PermissionGate>,
            ],
        },
    ];

    return (
        <PageContainer>
            <ProTable<API.Role>
                headerTitle={intl.formatMessage({ id: 'menu.roles' })}
                actionRef={actionRef}
                rowKey="id"
                search={{
                    labelWidth: 'auto',
                }}
                toolBarRender={() => [
                    <PermissionGate key="create" permission="ROLE_CREATE">
                        <Button
                            type="primary"
                            key="primary"
                            onClick={() => {
                                form.resetFields();
                                setCreateModalVisible(true);
                            }}
                        >
                            <PlusOutlined /> {intl.formatMessage({ id: 'common.create' })}
                        </Button>
                    </PermissionGate>,
                ]}
                request={async (params) => {
                    const res = await getRoles(params);
                    return {
                        data: (res.data as API.Role[]) || [],
                        success: true,
                    };
                }}
                columns={columns}
            />

            <Modal
                title={intl.formatMessage({ id: 'common.create' })}
                open={createModalVisible}
                onOk={() => form.submit()}
                onCancel={() => setCreateModalVisible(false)}
            >
                <Form form={form} onFinish={handleCreate} layout="vertical">
                    <Form.Item name="name" label={intl.formatMessage({ id: 'pages.role.name' })} rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="code" label={intl.formatMessage({ id: 'pages.role.code' })} rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label={intl.formatMessage({ id: 'pages.role.description' })}>
                        <Input.TextArea />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={intl.formatMessage({ id: 'common.edit' })}
                open={editModalVisible}
                onOk={() => form.submit()}
                onCancel={() => setEditModalVisible(false)}
            >
                <Form form={form} onFinish={handleUpdate} layout="vertical">
                    <Form.Item name="name" label={intl.formatMessage({ id: 'pages.role.name' })} rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="code" label={intl.formatMessage({ id: 'pages.role.code' })} rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label={intl.formatMessage({ id: 'pages.role.description' })}>
                        <Input.TextArea />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={intl.formatMessage({ id: 'pages.role.assignPermissions' })}
                open={permissionModalVisible}
                onOk={handleAssignPermissions}
                onCancel={() => setPermissionModalVisible(false)}
                width={800}
            >
                <Transfer
                    dataSource={allPermissions.map(p => ({
                        key: String(p.id),
                        title: `${p.name} (${p.code})`,
                        description: p.description,
                    }))}
                    titles={[intl.formatMessage({ id: 'pages.role.source' }), intl.formatMessage({ id: 'pages.role.target' })]}
                    targetKeys={targetKeys}
                    onChange={(nextTargetKeys) => setTargetKeys(nextTargetKeys as string[])}
                    render={(item) => item.title}
                    listStyle={{
                        width: 350,
                        height: 400,
                    }}
                />
            </Modal>
        </PageContainer>
    );
};

export default RoleManagement;
