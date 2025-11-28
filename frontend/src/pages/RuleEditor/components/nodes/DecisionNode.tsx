import React, { memo, useEffect, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Select, Input, Space, Typography, Tag } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { BaseNode } from './BaseNode';
import { CompositionInput, CompositionTextArea } from '../CompositionInput';
import { getVariablesByPackage } from '@/services/RuleVariableController';
import { useIntl } from '@umijs/max';
import { CONDITION_OPERATORS, DEFAULT_OPERATORS } from '../../constants/ConditionOperators';

const { Text } = Typography;

const DecisionNode = (props: NodeProps) => {
    const { id, data } = props;
    const [variables, setVariables] = useState<any[]>([]);
    const hasFetched = React.useRef(false);
    const intl = useIntl();

    useEffect(() => {
        if (data.packageId && !hasFetched.current) {
            hasFetched.current = true;
            const fetchVariables = async () => {
                try {
                    const res = await getVariablesByPackage(data.packageId);
                    setVariables(res.data || []);
                } catch (e) {
                    // Ignore
                }
            };
            fetchVariables();
        }
    }, [data.packageId]);

    const handleDataChange = (updates: any) => {
        if (data.onChange) {
            data.onChange(id, { ...data, ...updates });
        }
    };

    const selectedVar = variables.find(v => v.code === data.parameter);
    const logicType = data.logicType || 'CONDITION';

    const handleDeleteCondition = (conditionId: string) => {
        const newConditions = data.conditions.filter((c: any) => c.id !== conditionId);
        handleDataChange({ conditions: newConditions });
    };

    const handleConditionChange = (conditionId: string, field: string, value: any) => {
        const newConditions = data.conditions.map((c: any) => {
            if (c.id === conditionId) {
                return { ...c, [field]: value };
            }
            return c;
        });
        handleDataChange({ conditions: newConditions });
    };

    // Migration: If data.parameter exists but conditions is empty, create first condition
    useEffect(() => {
        // Only run migration if onChange is available to save the changes
        if (data.onChange && data.parameter && (!data.conditions || data.conditions.length === 0)) {
            handleDataChange({
                conditions: [{
                    id: `c_${Date.now()}`,
                    parameter: data.parameter,
                    operator: data.operator || '==',
                    value: data.value || ''
                }],
                parameter: undefined, // Clear old data
                operator: undefined,
                value: undefined
            });
        }
    }, [data.parameter, data.conditions, data.onChange]);

    const dualHandles = (
        <>
            <div style={{ position: 'absolute', right: -12, top: '35%', transform: 'translate(100%, -50%)', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#52c41a', marginRight: 4 }}>True</span>
                <Handle
                    type="source"
                    position={Position.Right}
                    id="true"
                    className="custom-node-handle"
                    style={{ position: 'relative', transform: 'none', top: 0, right: 0, background: '#52c41a' }}
                />
            </div>
            <div style={{ position: 'absolute', right: -12, top: '75%', transform: 'translate(100%, -50%)', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#ff4d4f', marginRight: 4 }}>False</span>
                <Handle
                    type="source"
                    position={Position.Right}
                    id="false"
                    className="custom-node-handle"
                    style={{ position: 'relative', transform: 'none', top: 0, right: 0, background: '#ff4d4f' }}
                />
            </div>
        </>
    );

    return (
        <BaseNode {...props} sourceHandles={dualHandles}>
            {/* Header Content */}
            <Space size={4} align="center">
                <Text style={{ fontSize: 14 }}>🔷</Text>
                <Text strong style={{ fontSize: 12 }}>{intl.formatMessage({ id: 'pages.editor.node.decision' })}</Text>
            </Space>

            {/* Body Content */}
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 10 }}>Type</Text>
                    <Select
                        className="nodrag"
                        popupClassName="node-dropdown"
                        dropdownMatchSelectWidth={false}
                        value={logicType}
                        onChange={(value) => handleDataChange({ logicType: value })}
                        size="small"
                        variant="borderless"
                        style={{ width: 120, fontSize: 10, textAlign: 'right' }}
                        options={[
                            { label: intl.formatMessage({ id: 'pages.editor.node.variable' }), value: 'CONDITION' },
                            { label: intl.formatMessage({ id: 'pages.editor.node.expression' }), value: 'EXPRESSION' }
                        ]}
                    />
                </div>

                {logicType === 'CONDITION' ? (
                    <Space direction="vertical" size={6} style={{ width: '100%' }} className="nodrag">
                        {/* Logic Toggle (AND/OR) */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={{ fontSize: 10, color: '#888' }}>Logic:</Text>
                            <Select
                                className="nodrag"
                                popupClassName="node-dropdown"
                                value={data.conditionLogic || 'AND'}
                                onChange={(value) => handleDataChange({ conditionLogic: value })}
                                size="small"
                                style={{ width: 80, fontSize: 10 }}
                                options={[
                                    { label: 'AND', value: 'AND' },
                                    { label: 'OR', value: 'OR' }
                                ]}
                            />
                        </div>

                        {/* Conditions List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {(data.conditions || []).map((c: any) => {
                                const selectedVar = variables.find(v => v.code === c.parameter);
                                const varType = selectedVar?.type || 'STRING';
                                const operators = CONDITION_OPERATORS[varType] || DEFAULT_OPERATORS;

                                return (
                                    <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 4, border: '1px dashed #444', borderRadius: 4 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Select
                                                className="nodrag"
                                                popupClassName="node-dropdown"
                                                dropdownMatchSelectWidth={false}
                                                value={c.parameter}
                                                onChange={(value) => handleConditionChange(c.id, 'parameter', value)}
                                                placeholder={intl.formatMessage({ id: 'pages.editor.node.selectVariable' })}
                                                style={{ minWidth: 120, flex: 1 }}
                                                size="small"
                                                suffixIcon={<DownOutlined style={{ fontSize: 10 }} />}
                                            >
                                                {variables.map(v => (
                                                    <Select.Option key={v.code} value={v.code}>
                                                        <Space>
                                                            <span>{v.name}</span>
                                                            <Text type="secondary" style={{ fontSize: 10 }}>{v.code}</Text>
                                                        </Space>
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                            <Text
                                                type="danger"
                                                style={{ cursor: 'pointer', fontSize: 10 }}
                                                onClick={() => handleDeleteCondition(c.id)}
                                            >
                                                ✕
                                            </Text>
                                        </div>
                                        <Space.Compact style={{ width: '100%' }}>
                                            <Select
                                                className="nodrag"
                                                popupClassName="node-dropdown"
                                                dropdownMatchSelectWidth={false}
                                                value={c.operator}
                                                onChange={(value) => handleConditionChange(c.id, 'operator', value)}
                                                placeholder="op"
                                                style={{ width: 100 }}
                                                size="small"
                                                options={operators}
                                            />
                                            {!['isNull', 'isNotNull', 'isEmpty', 'isNotEmpty'].includes(c.operator) && (
                                                <CompositionInput
                                                    className="nodrag"
                                                    value={c.value}
                                                    onChange={(e: any) => handleConditionChange(c.id, 'value', e.target.value)}
                                                    placeholder="值"
                                                    style={{ minWidth: 100, flex: 1 }}
                                                    size="small"
                                                />
                                            )}
                                        </Space.Compact>
                                    </div>
                                );
                            })}
                        </div>
                    </Space>
                ) : (
                    <CompositionTextArea
                        className="nodrag"
                        value={data.expression}
                        onChange={(e: any) => handleDataChange({ expression: e.target.value })}
                        placeholder="e.g. age > 18"
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        style={{ fontSize: 11, borderRadius: 4 }}
                    />
                )}
            </Space>
        </BaseNode>
    );
};

export default memo(DecisionNode);
