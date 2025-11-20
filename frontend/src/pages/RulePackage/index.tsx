import React, { useRef } from 'react';
import { PageContainer, ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Modal, Form, Input, message, Popconfirm, Drawer, List } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { history, request, useIntl } from '@umijs/max';
import { getPackages, createPackage, deletePackage, publishPackage, offlinePackage, getPackageVersions, rollbackPackageVersion, loadPackageGraph } from '@/services/RulePackageController';

const RulePackagePage: React.FC = () => {
    const actionRef = useRef<ActionType>();
    const [form] = Form.useForm();
    const [isModalVisible, setIsModalVisible] = React.useState(false);
    const intl = useIntl();
    const [publishModalVisible, setPublishModalVisible] = React.useState(false);
    const [versionDrawerVisible, setVersionDrawerVisible] = React.useState(false);
    const [currentPackage, setCurrentPackage] = React.useState<API.RulePackage | null>(null);
    const [versionList, setVersionList] = React.useState<any[]>([]);

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
        setPublishModalVisible(true);
    };

    const confirmPublish = async (values: any) => {
        try {
            await publishPackage(currentPackage!.id, values.description);
            message.success(intl.formatMessage({ id: 'pages.package.publishSuccess' }));
            setPublishModalVisible(false);
            actionRef.current?.reload();
        } catch (error) {
            message.error(intl.formatMessage({ id: 'pages.package.publishFailed' }));
        }
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

    const showVersions = async (record: API.RulePackage) => {
        setCurrentPackage(record);
        try {
            const res = await getPackageVersions(record.id);
            setVersionList((res.data as API.RulePackageVersion[]) || []);
            setVersionDrawerVisible(true);
        } catch (error) {
            message.error(intl.formatMessage({ id: 'pages.package.loadVersionsFailed' }));
        }
    };

    const handleRollback = async (versionId: number) => {
        if (!currentPackage) return;
        try {
            await rollbackPackageVersion(currentPackage.id, versionId);
            message.success(intl.formatMessage({ id: 'pages.package.rollbackSuccess' }));
            setVersionDrawerVisible(false);
            actionRef.current?.reload();
        } catch (error) {
            message.error(intl.formatMessage({ id: 'pages.package.rollbackFailed' }));
        }
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
                DRAFT: { text: 'Draft', status: 'Default' },
                PUBLISHED: { text: 'Published', status: 'Success' },
                ARCHIVED: { text: 'Offline', status: 'Error' },
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
                <a key="edit" onClick={() => history.push(`/editor/${record.code}`)}>{intl.formatMessage({ id: 'common.edit' })}</a>,
                record.status !== 'PUBLISHED' && (
                    <a key="publish" onClick={() => handlePublish(record)}>{intl.formatMessage({ id: 'pages.package.publish' })}</a>
                ),
                record.status === 'PUBLISHED' && (
                    <Popconfirm title={intl.formatMessage({ id: 'pages.package.confirmOffline' })} onConfirm={() => handleOffline(record)}>
                        <a key="offline" style={{ color: '#faad14' }}>{intl.formatMessage({ id: 'pages.package.offline' })}</a>
                    </Popconfirm>
                ),
                <a key="versions" onClick={() => showVersions(record)}>{intl.formatMessage({ id: 'pages.package.versions' })}</a>,
                <Popconfirm
                    key="delete"
                    title={intl.formatMessage({ id: 'message.deleteConfirm' })}
                    onConfirm={() => handleDelete(record.id)}
                >
                    <a style={{ color: 'red' }}>{intl.formatMessage({ id: 'common.delete' })}</a>
                </Popconfirm>,
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
                    <Button key="button" icon={<PlusOutlined />} type="primary" onClick={() => setIsModalVisible(true)}>
                        {intl.formatMessage({ id: 'common.create' })}
                    </Button>,
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

            <Modal
                title={intl.formatMessage({ id: 'pages.package.publishVersion' })}
                open={publishModalVisible}
                onCancel={() => setPublishModalVisible(false)}
                onOk={() => document.getElementById('publish-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
            >
                <Form
                    id="publish-form"
                    onFinish={confirmPublish}
                    layout="vertical"
                >
                    <Form.Item name="version" label={intl.formatMessage({ id: 'pages.package.version' })} initialValue={`V${Date.now().toString().slice(-4)}`}>
                        <Input disabled />
                    </Form.Item>
                    <Form.Item name="description" label={intl.formatMessage({ id: 'pages.package.versionDescription' })} rules={[{ required: true }]}>
                        <Input.TextArea placeholder="请输入本次发布的变更内容" />
                    </Form.Item>
                </Form>
            </Modal>

            <Drawer
                title={intl.formatMessage({ id: 'pages.package.versionHistory' })}
                placement="right"
                onClose={() => setVersionDrawerVisible(false)}
                open={versionDrawerVisible}
                width={400}
            >
                <List
                    itemLayout="horizontal"
                    dataSource={versionList}
                    renderItem={(item: any) => (
                        <List.Item actions={[<a key="rollback" onClick={() => handleRollback(item.id)}>{intl.formatMessage({ id: 'pages.package.rollback' })}</a>]}>
                            <List.Item.Meta
                                title={item.version}
                                description={
                                    <>
                                        <div>{new Date(item.createdAt).toLocaleString()}</div>
                                        <div>{item.description}</div>
                                        <div style={{ fontSize: 12, color: '#999' }}>by {item.createdBy}</div>
                                    </>
                                }
                            />
                        </List.Item>
                    )}
                />
            </Drawer>
        </PageContainer>
    );
};

export default RulePackagePage;
