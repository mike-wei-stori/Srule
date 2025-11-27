import React, { useRef, useState, useEffect } from 'react';
import {
    ProTable,
    ActionType,
    ProColumns,
    DrawerForm,
    ProFormText,
    ProFormSelect,
    ProFormTextArea,
    ProFormDigit,
    ProFormDatePicker,
    ProFormSwitch,
    ProFormDependency,
} from '@ant-design/pro-components';
import { Button, message, Popconfirm, Tag, List, Typography, Space, Tooltip } from 'antd';
import { PlusOutlined, LinkOutlined } from '@ant-design/icons';
import { useIntl, history } from '@umijs/max';
import { getVariablesByPackage, createVariable, updateVariable, deleteVariable } from '@/services/RuleVariableController';
import { getFeatures } from '@/services/FeatureController';

interface ParameterPanelProps {
    packageId: number;
}

const ParameterPanel: React.FC<ParameterPanelProps> = ({ packageId }) => {
    const actionRef = useRef<ActionType>();
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [currentRow, setCurrentRow] = useState<API.RuleVariable | undefined>(undefined);
    const [features, setFeatures] = useState<API.Feature[]>([]);
    const intl = useIntl();

    useEffect(() => {
        const fetchFeatures = async () => {
            try {
                const res = await getFeatures({});
                if (res.data) {
                    setFeatures(res.data);
                }
            } catch (e) {
                // Ignore
            }
        };
        fetchFeatures();
    }, []);

    const handleEdit = (record: API.RuleVariable) => {
        setCurrentRow(record);
        setDrawerVisible(true);
    };

    const handleAdd = () => {
        setCurrentRow(undefined);
        setDrawerVisible(true);
    };

    const columns: ProColumns<API.RuleVariable>[] = [
        {
            title: 'Name',
            dataIndex: 'name',
            copyable: true,
            ellipsis: true,
        },
        {
            title: 'Code',
            dataIndex: 'code',
            copyable: true,
            ellipsis: true,
        },
        {
            title: 'Type',
            dataIndex: 'type',
            valueType: 'select',
            valueEnum: {
                STRING: { text: 'String', status: 'Default' },
                INTEGER: { text: 'Integer', status: 'Processing' },
                DOUBLE: { text: 'Double', status: 'Processing' },
                BOOLEAN: { text: 'Boolean', status: 'Success' },
                DATE: { text: 'Date', status: 'Warning' },
                OBJECT: { text: 'Object', status: 'Error' },
                LIST: { text: 'List', status: 'Default' },
                MAP: { text: 'Map', status: 'Default' },
            },
        },
        {
            title: 'Category',
            dataIndex: 'category',
            valueType: 'select',
            valueEnum: {
                INPUT: { text: 'Input', status: 'Processing' },
                OUTPUT: { text: 'Output', status: 'Success' },
                INTERNAL: { text: 'Internal', status: 'Default' },
            },
            render: (_, record) => {
                let color = 'default';
                if (record.category === 'INPUT') color = 'blue';
                if (record.category === 'OUTPUT') color = 'green';
                return <Tag color={color}>{record.category}</Tag>;
            },
        },
        {
            title: 'Linked Feature',
            dataIndex: 'featureId',
            render: (_, record) => {
                if (record.category === 'INPUT' && record.featureId) {
                    const feature = features.find(f => f.id === record.featureId);
                    if (feature) {
                        let featureParams: any[] = [];
                        if (feature.config) {
                            try {
                                const config = JSON.parse(feature.config);
                                if (config.parameters) {
                                    featureParams = config.parameters;
                                }
                            } catch (e) {
                                // ignore
                            }
                        }

                        const content = (
                            <div style={{ maxWidth: 300 }}>
                                <p><strong>Code:</strong> {feature.code}</p>
                                <p><strong>Type:</strong> {feature.type}</p>
                                <p><strong>Return:</strong> {feature.returnType}</p>
                                {feature.description && <p><strong>Desc:</strong> {feature.description}</p>}
                                {featureParams.length > 0 && (
                                    <>
                                        <p><strong>Parameters:</strong></p>
                                        <ul style={{ paddingLeft: 20, margin: 0 }}>
                                            {featureParams.map((p: any) => (
                                                <li key={p.name}>{p.name} ({p.type})</li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </div>
                        );

                        return (
                            <Tooltip title={content}>
                                <a onClick={() => window.open(`/features/${feature.id}`, '_blank')}>
                                    <Tag color="purple" style={{ cursor: 'pointer' }}>
                                        {feature.name} <LinkOutlined />
                                    </Tag>
                                </a>
                            </Tooltip>
                        );
                    }
                }
                return '-';
            },
            search: false,
        },
        {
            title: 'Default Value',
            dataIndex: 'defaultValue',
            ellipsis: true,
        },
        {
            title: 'Description',
            dataIndex: 'description',
            ellipsis: true,
            search: false,
        },
        {
            title: intl.formatMessage({ id: 'common.actions' }),
            valueType: 'option',
            render: (text, record, _, action) => [
                <a
                    key="edit"
                    onClick={() => handleEdit(record)}
                >
                    {intl.formatMessage({ id: 'common.edit' })}
                </a>,
                <Popconfirm
                    key="delete"
                    title="Are you sure?"
                    onConfirm={async () => {
                        await deleteVariable(record.id!);
                        message.success(intl.formatMessage({ id: 'common.success' }));
                        actionRef.current?.reload();
                    }}
                >
                    <a style={{ color: 'red' }}>{intl.formatMessage({ id: 'common.delete' })}</a>
                </Popconfirm>,
            ],
        },
    ];

    return (
        <>
            <ProTable<API.RuleVariable>
                headerTitle="Parameters"
                actionRef={actionRef}
                rowKey="id"
                search={false}
                toolBarRender={() => [
                    <Button
                        type="primary"
                        key="primary"
                        onClick={handleAdd}
                    >
                        <PlusOutlined /> Add Parameter
                    </Button>,
                ]}
                request={async () => {
                    const res = await getVariablesByPackage(packageId);
                    return {
                        data: (res.data as API.RuleVariable[]) || [],
                        success: res.success,
                    };
                }}
                columns={columns}
            />

            <DrawerForm<API.RuleVariable>
                title={currentRow ? "Edit Parameter" : "Add Parameter"}
                width={500}
                visible={drawerVisible}
                onVisibleChange={setDrawerVisible}
                initialValues={currentRow}
                drawerProps={{
                    destroyOnClose: true,
                }}
                onFinish={async (values) => {
                    try {
                        const data = { ...values, packageId };
                        if (currentRow?.id) {
                            await updateVariable(currentRow.id, data);
                        } else {
                            await createVariable(data);
                        }
                        message.success(intl.formatMessage({ id: 'common.success' }));
                        setDrawerVisible(false);
                        actionRef.current?.reload();
                        return true;
                    } catch (error) {
                        message.error('Failed to save parameter');
                        return false;
                    }
                }}
            >
                <ProFormText
                    name="name"
                    label="Name"
                    placeholder="e.g. userAge"
                    rules={[{ required: true, message: 'Please enter parameter name' }]}
                />
                <ProFormText
                    name="code"
                    label="Code"
                    placeholder="e.g. user_age"
                    rules={[{ required: true, message: 'Please enter parameter code' }]}
                />
                <ProFormSelect
                    name="category"
                    label="Category"
                    options={[
                        { label: 'Input', value: 'INPUT' },
                        { label: 'Output', value: 'OUTPUT' },
                        { label: 'Internal', value: 'INTERNAL' },
                    ]}
                    rules={[{ required: true, message: 'Please select category' }]}
                />

                <ProFormDependency name={['category', 'featureId']}>
                    {({ category, featureId }) => {
                        if (category === 'INPUT') {
                            const selectedFeature = features.find(f => f.id === featureId);
                            let featureParams: any[] = [];
                            if (selectedFeature && selectedFeature.config) {
                                try {
                                    const config = JSON.parse(selectedFeature.config);
                                    if (config.parameters) {
                                        featureParams = config.parameters;
                                    }
                                } catch (e) {
                                    // ignore
                                }
                            }

                            return (
                                <>
                                    <ProFormSelect
                                        name="featureId"
                                        label="Linked Feature"
                                        options={features.map(f => ({ label: f.name, value: f.id }))}
                                        placeholder="Select a feature to link"
                                        showSearch
                                    />
                                    {featureId && (
                                        <div style={{ marginBottom: 24, background: 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 6 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <Typography.Text strong>Feature Requirements:</Typography.Text>
                                                <a onClick={() => window.open(`/features/${featureId}`, '_blank')}>
                                                    <Space size={4}>
                                                        View Feature <LinkOutlined />
                                                    </Space>
                                                </a>
                                            </div>
                                            {featureParams.length > 0 ? (
                                                <List
                                                    size="small"
                                                    dataSource={featureParams}
                                                    renderItem={(item) => (
                                                        <List.Item>
                                                            <Typography.Text code>{item.name}</Typography.Text>
                                                            <Tag style={{ marginLeft: 8 }}>{item.type}</Tag>
                                                        </List.Item>
                                                    )}
                                                />
                                            ) : (
                                                <Typography.Text type="secondary">No parameters defined for this feature.</Typography.Text>
                                            )}
                                        </div>
                                    )}
                                </>
                            );
                        }
                        return null;
                    }}
                </ProFormDependency>
                <ProFormSelect
                    name="type"
                    label="Type"
                    options={[
                        { label: 'String', value: 'STRING' },
                        { label: 'Integer', value: 'INTEGER' },
                        { label: 'Double', value: 'DOUBLE' },
                        { label: 'Boolean', value: 'BOOLEAN' },
                        { label: 'Date', value: 'DATE' },
                        { label: 'Object', value: 'OBJECT' },
                        { label: 'List', value: 'LIST' },
                        { label: 'Map', value: 'MAP' },
                    ]}
                    rules={[{ required: true, message: 'Please select type' }]}
                />

                <ProFormDependency name={['type']}>
                    {({ type }) => {
                        if (type === 'BOOLEAN') {
                            return (
                                <ProFormSelect
                                    name="defaultValue"
                                    label="Default Value"
                                    options={[
                                        { label: 'True', value: 'true' },
                                        { label: 'False', value: 'false' },
                                    ]}
                                />
                            );
                        }
                        if (type === 'DATE') {
                            return (
                                <ProFormDatePicker
                                    name="defaultValue"
                                    label="Default Value"
                                    width="xl"
                                />
                            );
                        }
                        if (type === 'INTEGER' || type === 'DOUBLE') {
                            return (
                                <ProFormDigit
                                    name="defaultValue"
                                    label="Default Value"
                                    width="xl"
                                />
                            );
                        }
                        if (type === 'LIST' || type === 'MAP' || type === 'OBJECT') {
                            return (
                                <ProFormTextArea
                                    name="defaultValue"
                                    label="Default Value (JSON)"
                                    placeholder="e.g. {'key': 'value'} or [1, 2, 3]"
                                />
                            );
                        }
                        return (
                            <ProFormText
                                name="defaultValue"
                                label="Default Value"
                            />
                        );
                    }}
                </ProFormDependency>

                <ProFormTextArea
                    name="description"
                    label="Description"
                />
            </DrawerForm>
        </>
    );
};

export default ParameterPanel;
