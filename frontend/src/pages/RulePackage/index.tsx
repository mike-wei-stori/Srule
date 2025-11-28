import React, { useRef } from 'react';
import { PageContainer, ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Modal, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, CloudUploadOutlined, HistoryOutlined } from '@ant-design/icons';
import { history, useIntl } from '@umijs/max';
import { getPackages, createPackage, deletePackage, offlinePackage } from '@/services/RulePackageController';
import PublishModal from '../RuleEditor/components/PublishModal';
import VersionListDrawer from '../RuleEditor/components/VersionListDrawer';
import PermissionGate from '@/components/PermissionGate';

const RulePackagePage: React.FC = () => {
    const actionRef = useRef<ActionType>();
    const [form] = Form.useForm();
    const [isModalVisible, setIsModalVisible] = React.useState(false);
    const intl = useIntl();

    // New components state
    const [publishVisible, setPublishVisible] = React.useState(false);
    const [versionsVisible, setVersionsVisible] = React.useState(false);
    const [currentPackage, setCurrentPackage] = React.useState<API.RulePackage | null>(null);

    const handleAdd = async (values: any) => {
        await createPackage(values);
        message.success(intl.formatMessage({ id: 'common.success' }));
        setIsModalVisible(false);
        actionRef.current?.reload();
    };

    const handleDelete = async (id: number) => {
        await deletePackage(id);
        message.success(intl.formatMessage({ id: 'common.success' }));
        actionRef.current?.reload();
    };

    const handlePublish = (record: API.RulePackage) => {
        setCurrentPackage(record);
        setPublishVisible(true);
    };

    const showVersions = (record: API.RulePackage) => {
        setCurrentPackage(record);
        setVersionsVisible(true);
    };

    const handleOffline = async (record: API.RulePackage) => {
        try {
            await offlinePackage(record.id);
            message.success(intl.formatMessage({ id: 'pages.package.offlineSuccess' }));
            actionRef.current?.reload();
        } catch (error) {
            message.error(intl.formatMessage({ id: 'pages.package.offlineFailed' }));
        }
    };

    const onPublishSuccess = () => {
        actionRef.current?.reload();
    };

    const onVersionChange = () => {
        actionRef.current?.reload();
    };

    const columns: ProColumns<API.RulePackage>[] = [
        {
            title: intl.formatMessage({ id: 'pages.package.name' }),
            dataIndex: 'name',
        },
        {
            title: intl.formatMessage({ id: 'pages.package.code' }),
            dataIndex: 'code',
        },
        {
            title: intl.formatMessage({ id: 'pages.package.status' }),
            dataIndex: 'status',
            valueEnum: {
                DRAFT: { text: intl.formatMessage({ id: 'status.draft' }), status: 'Default' },
                PUBLISHED: { text: intl.formatMessage({ id: 'status.published' }), status: 'Success' },
                ARCHIVED: { text: intl.formatMessage({ id: 'status.archived' }), status: 'Error' },
            },
        },
        {
            title: intl.formatMessage({ id: 'pages.package.description' }),
            dataIndex: 'description',
            hideInSearch: true,
        },
        {
            title: intl.formatMessage({ id: 'common.actions' }),
            valueType: 'option',
            width: 250,
            render: (_, record) => [
                <PermissionGate permission="PACKAGE_UPDATE">
                    <a key="edit" onClick={() => history.push(`/editor/${record.code}`)}>{intl.formatMessage({ id: 'common.edit' })}</a>
                </PermissionGate>,
                <PermissionGate permission="PACKAGE_PUBLISH">
                    <a key="publish" onClick={() => handlePublish(record)}>{intl.formatMessage({ id: 'pages.package.publish' })}</a>
                </PermissionGate>,
                record.status === 'PUBLISHED' && (
                    <PermissionGate permission="PACKAGE_OFFLINE">
                        <Popconfirm title={intl.formatMessage({ id: 'pages.package.confirmOffline' })} onConfirm={() => handleOffline(record)}>
                            <a key="offline" style={{ color: '#faad14' }}>{intl.formatMessage({ id: 'pages.package.offline' })}</a>
                        </Popconfirm>
                    </PermissionGate>
                ),
                <PermissionGate permission="PACKAGE_READ">
                    <a key="versions" onClick={() => showVersions(record)}>{intl.formatMessage({ id: 'pages.package.versions' })}</a>
                </PermissionGate>,
                <PermissionGate permission="PACKAGE_DELETE">
                    <Popconfirm
                        key="delete"
                        title={intl.formatMessage({ id: 'message.deleteConfirm' })}
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <a style={{ color: 'red' }}>{intl.formatMessage({ id: 'common.delete' })}</a>
                    </Popconfirm>
                </PermissionGate>,
            ],
        },
    ];

    return (
        <PageContainer>
            <ProTable<API.RulePackage>
                headerTitle={intl.formatMessage({ id: 'menu.packages' })}
                actionRef={actionRef}
                rowKey="id"
                search={{ labelWidth: 'auto' }}
                toolBarRender={() => [
                    <PermissionGate key="create" permission="PACKAGE_CREATE">
                        <Button key="button" icon={<PlusOutlined />} type="primary" onClick={() => setIsModalVisible(true)}>
                            {intl.formatMessage({ id: 'common.create' })}
                        </Button>
                    </PermissionGate>,
                ]}
                request={async (params) => {
                    const res = await getPackages(params);
                    return {
                        data: (res.data as API.RulePackage[]) || [],
                        success: res.success,
                        total: (res.data as API.RulePackage[])?.length || 0,
                    };
                }}
                columns={columns}
            />
            <Modal
                title={intl.formatMessage({ id: 'common.create' })}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
            >
                <Form form={form} onFinish={handleAdd} layout="vertical">
                    <Form.Item name="name" label={intl.formatMessage({ id: 'pages.package.name' })} rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="code" label={intl.formatMessage({ id: 'pages.package.code' })} rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label={intl.formatMessage({ id: 'pages.package.description' })}>
                        <Input.TextArea />
                    </Form.Item>
                </Form>
            </Modal>

            {currentPackage && (
                <>
                    <PublishModal
                        visible={publishVisible}
                        onCancel={() => setPublishVisible(false)}
                        onSuccess={onPublishSuccess}
                        packageId={currentPackage.id}
                    // contentJson is optional, backend handles it
                    />
                    <VersionListDrawer
                        visible={versionsVisible}
                        onClose={() => setVersionsVisible(false)}
                        packageId={currentPackage.id}
                        activeVersionId={currentPackage.activeVersionId}
                        onVersionChange={onVersionChange}
                    />
                </>
            )}
        </PageContainer>
    );
};

export default RulePackagePage;
