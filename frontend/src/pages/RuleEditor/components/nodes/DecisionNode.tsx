import React, { memo, useEffect, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Select, Input, Space, Typography, Tag } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { BaseNode } from './BaseNode';
import { getVariablesByPackage } from '@/services/RuleVariableController';

const { Text } = Typography;

const DecisionNode = (props: NodeProps) => {
    const { id, data } = props;
    const [variables, setVariables] = useState<any[]>([]);
    const hasFetched = React.useRef(false);

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
        data.onChange(id, { ...data, ...updates });
    };

    const selectedVar = variables.find(v => v.code === data.parameter);
    const logicType = data.logicType || 'CONDITION';

    const dualHandles = (
        <>
            <div style={{ position: 'absolute', right: -12, top: '35%', transform: 'translate(100%, -50%)', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#52c41a', marginRight: 4 }}>True</span>
                <Handle
                    type="source"
                    position={Position.Right}
                    id="true"
                    style={{ position: 'relative', transform: 'none', top: 0, right: 0, background: '#52c41a', width: 8, height: 8 }}
                />
            </div>
            <div style={{ position: 'absolute', right: -12, top: '75%', transform: 'translate(100%, -50%)', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#ff4d4f', marginRight: 4 }}>False</span>
                <Handle
                    type="source"
                    position={Position.Right}
                    id="false"
                    style={{ position: 'relative', transform: 'none', top: 0, right: 0, background: '#ff4d4f', width: 8, height: 8 }}
                />
            </div>
        </>
    );

    return (
        <BaseNode {...props} sourceHandles={dualHandles}>
            {/* Header Content */}
            <Space size={4} align="center">
                <Text style={{ fontSize: 14 }}>🔷</Text>
                <Text strong style={{ fontSize: 12 }}>DECISION</Text>
            </Space>

            {/* Body Content */}
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 10 }}>Type</Text>
                    <Select
                        value={logicType}
                        onChange={(value) => handleDataChange({ logicType: value })}
                        size="small"
                        variant="borderless"
                        style={{ width: 70, fontSize: 10, textAlign: 'right' }}
                        options={[
                            { label: '变量', value: 'CONDITION' },
                            { label: '表达式', value: 'EXPRESSION' }
                        ]}
                    />
                </div>

                {logicType === 'CONDITION' ? (
                    <Space direction="vertical" size={6} style={{ width: '100%' }} className="nodrag">
                        <Select
                            value={data.parameter}
                            onChange={(value) => handleDataChange({ parameter: value })}
                            placeholder="选择变量"
                            style={{ width: '100%' }}
                            size="small"
                            status={!data.parameter ? 'warning' : ''}
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

                        <Space.Compact style={{ width: '100%' }}>
                            <Select
                                value={data.operator}
                                onChange={(value) => handleDataChange({ operator: value })}
                                placeholder="op"
                                style={{ width: '35%' }}
                                size="small"
                            >
                                <Select.Option value="==">==</Select.Option>
                                <Select.Option value="!=">!=</Select.Option>
                                <Select.Option value=">">&gt;</Select.Option>
                                <Select.Option value=">=">&gt;=</Select.Option>
                                <Select.Option value="<">&lt;</Select.Option>
                                <Select.Option value="<=">&lt;=</Select.Option>
                            </Select>
                            <Input
                                value={data.value}
                                onChange={(e) => handleDataChange({ value: e.target.value })}
                                placeholder="值"
                                style={{ width: '65%' }}
                                size="small"
                            />
                        </Space.Compact>

                        {selectedVar && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Tag color="blue" style={{ fontSize: 10, margin: 0, lineHeight: '16px', padding: '0 4px' }}>
                                    {selectedVar.type}
                                </Tag>
                            </div>
                        )}
                    </Space>
                ) : (
                    <Input.TextArea
                        className="nodrag"
                        value={data.expression}
                        onChange={(e) => handleDataChange({ expression: e.target.value })}
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
