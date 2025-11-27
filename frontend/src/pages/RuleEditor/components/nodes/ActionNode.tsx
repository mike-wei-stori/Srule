import React, { memo, useState, useEffect } from 'react';
import { NodeProps } from 'reactflow';
import { Select, Input, Space, Typography, Tag, InputNumber, DatePicker, Button, Divider, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, SwapOutlined } from '@ant-design/icons';
import { BaseNode } from './BaseNode';
import { getVariablesByPackage } from '@/services/RuleVariableController';
import dayjs from 'dayjs';

const { Text } = Typography;

const OPERATORS_BY_TYPE: Record<string, { value: string; label: string }[]> = {
    STRING: [
        { value: '=', label: '=' },
        { value: 'append', label: 'Append' },
        { value: 'prepend', label: 'Prepend' },
    ],
    INTEGER: [
        { value: '=', label: '=' },
        { value: '+=', label: '+=' },
        { value: '-=', label: '-=' },
        { value: '*=', label: '*=' },
        { value: '/=', label: '/=' },
    ],
    DOUBLE: [
        { value: '=', label: '=' },
        { value: '+=', label: '+=' },
        { value: '-=', label: '-=' },
        { value: '*=', label: '*=' },
        { value: '/=', label: '/=' },
    ],
    BOOLEAN: [
        { value: '=', label: '=' },
    ],
    DATE: [
        { value: '=', label: '=' },
    ],
    LIST: [
        { value: '=', label: '=' },
        { value: 'add', label: 'Add' },
        { value: 'remove', label: 'Remove' },
    ],
    MAP: [
        { value: '=', label: '=' },
        { value: 'put', label: 'Put' },
        { value: 'remove', label: 'Remove' },
    ]
};

interface ActionItem {
    targetParameter?: string;
    operation?: string;
    assignmentValue?: any;
    isReference?: boolean; // New flag to track input mode
}

const ListBuilder = ({ value, onChange }: { value: any[], onChange: (val: any[]) => void }) => {
    const list = Array.isArray(value) ? value : [];

    const addItem = () => {
        onChange([...list, '']);
    };

    const updateItem = (index: number, val: string) => {
        const newList = [...list];
        newList[index] = val;
        onChange(newList);
    };

    const removeItem = (index: number) => {
        onChange(list.filter((_, i) => i !== index));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            {list.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: 4 }}>
                    <Input
                        value={item}
                        onChange={(e) => updateItem(index, e.target.value)}
                        size="small"
                        placeholder={`Item ${index + 1}`}
                    />
                    <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeItem(index)}
                        danger
                    />
                </div>
            ))}
            <Button type="dashed" size="small" onClick={addItem} icon={<PlusOutlined />}>
                Add Item
            </Button>
        </div>
    );
};

const MapBuilder = ({ value, onChange }: { value: any[], onChange: (val: any[]) => void }) => {
    // Value is stored as array of {key, value} objects for UI
    const entries = Array.isArray(value) ? value : [];

    const addEntry = () => {
        onChange([...entries, { key: '', value: '' }]);
    };

    const updateEntry = (index: number, field: 'key' | 'value', val: string) => {
        const newEntries = [...entries];
        newEntries[index] = { ...newEntries[index], [field]: val };
        onChange(newEntries);
    };

    const removeEntry = (index: number) => {
        onChange(entries.filter((_, i) => i !== index));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            {entries.map((entry, index) => (
                <div key={index} style={{ display: 'flex', gap: 4 }}>
                    <Input
                        value={entry.key}
                        onChange={(e) => updateEntry(index, 'key', e.target.value)}
                        size="small"
                        placeholder="Key"
                        style={{ width: '40%' }}
                    />
                    <Input
                        value={entry.value}
                        onChange={(e) => updateEntry(index, 'value', e.target.value)}
                        size="small"
                        placeholder="Value"
                        style={{ width: '60%' }}
                    />
                    <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeEntry(index)}
                        danger
                    />
                </div>
            ))}
            <Button type="dashed" size="small" onClick={addEntry} icon={<PlusOutlined />}>
                Add Entry
            </Button>
        </div>
    );
};

const ActionNode = (props: NodeProps) => {
    const { id, data } = props;
    const [variables, setVariables] = useState<API.RuleVariable[]>([]);
    const hasFetched = React.useRef(false);

    useEffect(() => {
        if (data.packageId && !hasFetched.current) {
            hasFetched.current = true;
            const fetchVariables = async () => {
                try {
                    const res = await getVariablesByPackage(data.packageId);
                    setVariables((res.data as API.RuleVariable[]) || []);
                } catch (e) {
                    // Ignore
                }
            };
            fetchVariables();
        }
    }, [data.packageId]);

    // Migration for legacy single action
    useEffect(() => {
        if (!data.actions && data.targetParameter) {
            const legacyAction: ActionItem = {
                targetParameter: data.targetParameter,
                operation: data.operation || '=',
                assignmentValue: data.assignmentValue
            };
            data.onChange(id, {
                ...data,
                actions: [legacyAction],
                targetParameter: undefined,
                operation: undefined,
                assignmentValue: undefined
            });
        } else if (!data.actions) {
            data.onChange(id, { ...data, actions: [] });
        }
    }, []);

    const actions: ActionItem[] = data.actions || [];

    const handleActionChange = (index: number, updates: Partial<ActionItem>) => {
        const newActions = [...actions];
        newActions[index] = { ...newActions[index], ...updates };
        data.onChange(id, { ...data, actions: newActions });
    };

    const addAction = () => {
        data.onChange(id, { ...data, actions: [...actions, { operation: '=' }] });
    };

    const removeAction = (index: number) => {
        const newActions = actions.filter((_, i) => i !== index);
        data.onChange(id, { ...data, actions: newActions });
    };

    const getVariablePrefix = (category?: string) => {
        switch (category) {
            case 'INPUT': return '$f';
            case 'INTERNAL': return '$t';
            case 'OUTPUT': return '$o';
            default: return '$v';
        }
    };

    const renderInput = (action: ActionItem, index: number, varType: string) => {
        if (!action.targetParameter) return <Input disabled placeholder="Select var" size="small" />;

        const handleChange = (val: any) => handleActionChange(index, { assignmentValue: val });
        const toggleReference = () => handleActionChange(index, { isReference: !action.isReference, assignmentValue: undefined });

        const referenceSelector = (
            <Select
                value={action.assignmentValue}
                onChange={handleChange}
                style={{ width: '100%' }}
                size="small"
                placeholder="Select Variable"
                showSearch
                optionFilterProp="children"
            >
                {variables.map(v => {
                    const prefix = getVariablePrefix(v.category);
                    const value = `${prefix}.${v.code}`;
                    return (
                        <Select.Option key={v.code} value={value}>
                            <Space>
                                <Tag>{prefix}</Tag>
                                <Text>{v.name}</Text>
                                <Text type="secondary" style={{ fontSize: 10 }}>({v.type})</Text>
                            </Space>
                        </Select.Option>
                    );
                })}
            </Select>
        );

        const inputControl = (() => {
            if (action.isReference) return referenceSelector;

            // Special handling for List/Map builders when operation is '='
            if (action.operation === '=') {
                if (varType === 'LIST') {
                    return <ListBuilder value={action.assignmentValue} onChange={handleChange} />;
                }
                if (varType === 'MAP') {
                    return <MapBuilder value={action.assignmentValue} onChange={handleChange} />;
                }
            }

            switch (varType) {
                case 'BOOLEAN':
                    return (
                        <Select
                            value={action.assignmentValue}
                            onChange={handleChange}
                            style={{ width: '100%' }}
                            size="small"
                            options={[
                                { value: 'true', label: 'True' },
                                { value: 'false', label: 'False' }
                            ]}
                        />
                    );
                case 'DATE':
                    return (
                        <DatePicker
                            value={action.assignmentValue ? dayjs(action.assignmentValue) : null}
                            onChange={(_, dateString) => handleChange(dateString)}
                            style={{ width: '100%' }}
                            size="small"
                            showTime
                        />
                    );
                case 'INTEGER':
                case 'DOUBLE':
                    return (
                        <InputNumber
                            value={action.assignmentValue}
                            onChange={handleChange}
                            style={{ width: '100%' }}
                            size="small"
                        />
                    );
                default:
                    return (
                        <Input
                            value={action.assignmentValue}
                            onChange={(e) => handleChange(e.target.value)}
                            placeholder="Value"
                            size="small"
                        />
                    );
            }
        })();

        return (
            <div style={{ display: 'flex', gap: 4, width: '100%' }}>
                <div style={{ flex: 1 }}>
                    {inputControl}
                </div>
                <Tooltip title={action.isReference ? "Switch to Value" : "Switch to Reference"}>
                    <Button
                        icon={<SwapOutlined />}
                        size="small"
                        type={action.isReference ? 'primary' : 'default'}
                        onClick={toggleReference}
                    />
                </Tooltip>
            </div>
        );
    };

    return (
        <BaseNode {...props} style={{ maxWidth: 'none', minWidth: 350, width: 'auto' }}>
            {/* Header Content */}
            <Space size={4} align="center">
                <Text style={{ fontSize: 14 }}>🟢</Text>
                <Text strong style={{ fontSize: 12 }}>ACTION</Text>
            </Space>

            {/* Body Content */}
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
                {actions.map((action, index) => {
                    const selectedVar = variables.find(v => v.code === action.targetParameter);
                    const varType = selectedVar?.type || 'STRING';
                    const operators = OPERATORS_BY_TYPE[varType] || OPERATORS_BY_TYPE['STRING'];

                    return (
                        <div key={index} style={{
                            display: 'flex',
                            gap: 4,
                            alignItems: 'flex-start', // Align top for multi-line inputs
                            padding: '4px 0',
                            borderBottom: index < actions.length - 1 ? '1px dashed #f0f0f0' : 'none'
                        }} className="nodrag">
                            <Select
                                popupClassName="node-dropdown"
                                dropdownMatchSelectWidth={200}
                                value={action.targetParameter}
                                onChange={(value) => {
                                    handleActionChange(index, {
                                        targetParameter: value,
                                        operation: '=',
                                        assignmentValue: undefined,
                                        isReference: false
                                    });
                                }}
                                placeholder="Var"
                                style={{ width: 120, flexShrink: 0 }}
                                size="small"
                                status={!action.targetParameter ? 'warning' : ''}
                            >
                                {variables.filter(v => v.category === 'OUTPUT' || v.category === 'INTERNAL').map(v => (
                                    <Select.Option key={v.code} value={v.code}>
                                        <Space>
                                            <Text>{v.name}</Text>
                                            <Tag style={{ margin: 0, fontSize: 9 }}>{v.type}</Tag>
                                        </Space>
                                    </Select.Option>
                                ))}
                            </Select>
                            <Select
                                popupClassName="node-dropdown"
                                dropdownMatchSelectWidth={false}
                                value={action.operation || '='}
                                onChange={(val) => handleActionChange(index, { operation: val })}
                                style={{ width: 80, flexShrink: 0, textAlign: 'center' }}
                                size="small"
                                options={operators}
                            />
                            <div style={{ flex: 1, minWidth: 150 }}>
                                {renderInput(action, index, varType)}
                            </div>
                            <Button
                                type="text"
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => removeAction(index)}
                                danger
                            />
                        </div>
                    );
                })}

                <Button
                    type="dashed"
                    size="small"
                    block
                    icon={<PlusOutlined />}
                    onClick={addAction}
                >
                    Add Action
                </Button>
            </Space>
        </BaseNode>
    );
};

export default memo(ActionNode);
