import React, { memo, useEffect, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Select, Input, Space, Typography, Button, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { BaseNode } from './BaseNode';
import { getVariablesByPackage } from '@/services/RuleVariableController';
import { useIntl } from '@umijs/max';

const { Text } = Typography;

const SwitchNode = (props: NodeProps) => {
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

    const cases = data.cases || [];

    const addCase = () => {
        const newCase = {
            id: `case_${Date.now()}`,
            value: ''
        };
        handleDataChange({ cases: [...cases, newCase] });
    };

    const removeCase = (caseId: string) => {
        handleDataChange({ cases: cases.filter((c: any) => c.id !== caseId) });
    };

    const updateCase = (caseId: string, value: string) => {
        handleDataChange({
            cases: cases.map((c: any) => c.id === caseId ? { ...c, value } : c)
        });
    };

    // Calculate handle positions
    // We need to position handles relative to the node height.
    // Since the node height changes with content, we can try to position them aligned with the rows.
    // However, ReactFlow handles are absolute positioned.
    // A common trick is to render the handle inside the row div, but with absolute positioning relative to the row?
    // No, ReactFlow handles must be direct children of the node usually, or we need to be careful with stacking contexts.
    // Actually, if we put Handle inside the row div, it works if the row has relative positioning.

    return (
        <BaseNode {...props} sourceHandles={<></>}>
            <Space size={4} align="center">
                <Text style={{ fontSize: 14 }}>🔀</Text>
                <Text strong style={{ fontSize: 12 }}>{intl.formatMessage({ id: 'pages.editor.node.switch', defaultMessage: 'Switch Node' })}</Text>
            </Space>

            <Space direction="vertical" size={6} style={{ width: '100%', marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 10 }}>{intl.formatMessage({ id: 'pages.editor.node.variable', defaultMessage: 'Variable' })}:</Text>
                    <Select
                        className="nodrag"
                        popupClassName="node-dropdown"
                        value={data.parameter}
                        onChange={(val) => handleDataChange({ parameter: val })}
                        size="small"
                        style={{ flex: 1 }}
                        placeholder="Select variable"
                        showSearch
                        optionFilterProp="children"
                    >
                        {variables.map(v => (
                            <Select.Option key={v.code} value={v.code}>{v.name}</Select.Option>
                        ))}
                    </Select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {cases.map((c: any, index: number) => (
                        <div key={c.id} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Input
                                className="nodrag"
                                value={c.value}
                                onChange={(e) => updateCase(c.id, e.target.value)}
                                size="small"
                                placeholder="Value"
                                style={{ flex: 1 }}
                            />
                            <Button
                                type="text"
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => removeCase(c.id)}
                                danger
                            />
                            {/* Handle for this case */}
                            <div style={{ position: 'absolute', right: -16, top: '50%', transform: 'translateY(-50%)' }}>
                                <Handle
                                    type="source"
                                    position={Position.Right}
                                    id={c.id}
                                    className="custom-node-handle"
                                    style={{ background: '#13c2c2' }}
                                />
                            </div>
                            <div style={{
                                position: 'absolute',
                                right: -25,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: 9,
                                color: '#888',
                                pointerEvents: 'none'
                            }}>
                                {index + 1}
                            </div>
                        </div>
                    ))}
                </div>

                <Button
                    type="dashed"
                    size="small"
                    block
                    icon={<PlusOutlined />}
                    onClick={addCase}
                >
                    {intl.formatMessage({ id: 'pages.editor.node.switch.addCase', defaultMessage: 'Add Case' })}
                </Button>

                {/* Default Case */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, paddingTop: 4, borderTop: '1px dashed #eee' }}>
                    <Text style={{ fontSize: 10, color: '#888' }}>{intl.formatMessage({ id: 'pages.editor.node.switch.default', defaultMessage: 'Default' })}</Text>
                    <div style={{ position: 'absolute', right: -16, top: '50%', transform: 'translateY(-50%)' }}>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="default"
                            className="custom-node-handle"
                            style={{ background: '#888' }}
                        />
                    </div>
                </div>
            </Space>
        </BaseNode>
    );
};

export default memo(SwitchNode);
