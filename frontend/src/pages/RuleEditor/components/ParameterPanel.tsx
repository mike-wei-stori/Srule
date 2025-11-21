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
import { Button, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { getVariablesByPackage, createVariable, updateVariable, deleteVariable } from '@/services/RuleVariableController';

interface ParameterPanelProps {
    packageId: number;
}

const ParameterPanel: React.FC<ParameterPanelProps> = ({ packageId }) => {
    const actionRef = useRef<ActionType>();
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [currentRow, setCurrentRow] = useState<API.RuleVariable | undefined>(undefined);
    const intl = useIntl();

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
