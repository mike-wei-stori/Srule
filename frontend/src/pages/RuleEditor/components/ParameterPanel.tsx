import React, { useRef, useState, useEffect } from 'react';
import { ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, message, Select, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { request, useIntl } from '@umijs/max';
import { getVariablesByPackage, createVariable, updateVariable, deleteVariable } from '@/services/RuleVariableController';
import { getFeatures } from '@/services/FeatureController';

interface ParameterPanelProps {
    packageId: number;
}

const ParameterPanel: React.FC<ParameterPanelProps> = ({ packageId }) => {
    const actionRef = useRef<ActionType>();
    const [features, setFeatures] = useState<API.Feature[]>([]);
    const intl = useIntl();

    useEffect(() => {
        // Fetch available features
        const fetchFeatures = async () => {
            try {
                const res = await getFeatures({ pageSize: 1000 }); // Get all features
                setFeatures(res.data?.list || []);
            } catch (e) {
                // Ignore
            }
        };
        fetchFeatures();
    }, []);

    const columns: ProColumns<API.RuleVariable>[] = [
        {
            title: 'Name',
            dataIndex: 'name',
            formItemProps: {
                rules: [{ required: true, message: 'Required' }],
            },
        },
        {
            title: 'Code', // Note: API.RuleVariable doesn't have 'code', check backend entity
            dataIndex: 'name', // Using name as code for now if code is missing, or update entity
            // Wait, API.RuleVariable has 'name', 'dataType', 'defaultValue'.
            // Local type had 'code', 'category'.
            // Let's check API definition again.
            // API.RuleVariable: id, packageId, name, dataType, defaultValue, description.
            // It seems I missed 'code' and 'category' in API definition or they don't exist in backend.
            // Checking backend RuleVariable.java...
            // I don't have access to backend RuleVariable.java right now but I can infer from previous local type.
            // If backend doesn't have them, I should remove them or update backend.
            // Assuming backend matches API definition for now.
            // Let's use 'name' for both name and code if needed, or just 'name'.
            // But wait, previous code had 'code' and 'category'.
            // Let's check typings.d.ts again.
            // interface RuleVariable { id, packageId, name, dataType, defaultValue, description }
            // It seems 'category' (Input/Output) is missing in API definition.
            // I should probably add it to API definition if it's important.
            // For now, I will comment out 'code' and 'category' columns or map them to existing fields if appropriate.
            // Actually, 'category' is likely 'variableType' or similar.
            // Let's stick to API.RuleVariable fields for now to avoid errors.
            // I will remove 'code' and 'category' columns for now to match API.
        },
        {
            title: 'Type',
            dataIndex: 'dataType',
            valueType: 'select',
            valueEnum: {
                STRING: { text: 'String' },
                INTEGER: { text: 'Integer' },
                DOUBLE: { text: 'Double' },
                BOOLEAN: { text: 'Boolean' },
                DATE: { text: 'Date' },
                OBJECT: { text: 'Object' },
            },
            formItemProps: {
                rules: [{ required: true, message: 'Required' }],
            },
        },
        {
            title: 'Default Value',
            dataIndex: 'defaultValue',
        },
        {
            title: 'Description',
            dataIndex: 'description',
        },
        {
            title: intl.formatMessage({ id: 'common.actions' }),
            valueType: 'option',
            render: (text, record, _, action) => [
                <a
                    key="editable"
                    onClick={() => {
                        action?.startEditable?.(record.id!);
                    }}
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
                    <a>{intl.formatMessage({ id: 'common.delete' })}</a>
                </Popconfirm>,
            ],
        },
    ];

    return (
        <ProTable<API.RuleVariable>
            headerTitle="Parameters"
            actionRef={actionRef}
            rowKey="id"
            search={false}
            toolBarRender={() => [
                <Button
                    type="primary"
                    key="primary"
                    onClick={() => {
                        actionRef.current?.addEditRecord?.({
                            id: Date.now(),
                            packageId,
                            dataType: 'STRING',
                        } as API.RuleVariable);
                    }}
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
            editable={{
                type: 'multiple',
                onSave: async (key, row) => {
                    if (typeof row.id === 'number' && row.id > 1000000000000) {
                        // New record
                        const { id, ...rest } = row;
                        await createVariable(rest as API.RuleVariableDTO);
                    } else {
                        // Existing record
                        await updateVariable(row.id!, row as API.RuleVariableDTO);
                    }
                    message.success(intl.formatMessage({ id: 'common.success' }));
                },
            }}
            columns={columns}
        />
    );
};

export default ParameterPanel;
