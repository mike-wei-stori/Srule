import React, { memo, useState, useEffect } from 'react';
import { NodeProps } from 'reactflow';
import { Select, Input, Space, Typography, Tag } from 'antd';
import { BaseNode } from './BaseNode';
import { getVariablesByPackage } from '@/services/RuleVariableController';

const { Text } = Typography;

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

    const handleDataChange = (updates: any) => {
        data.onChange(id, { ...data, ...updates });
    };

    const selectedVar = variables.find(v => v.code === data.targetParameter);

    return (
        <BaseNode {...props}>
            {/* Header Content */}
            <Space size={4} align="center">
                <Text style={{ fontSize: 14 }}>🟢</Text>
                <Text strong style={{ fontSize: 12 }}>ACTION</Text>
            </Space>

            {/* Body Content */}
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space.Compact style={{ width: '100%' }} className="nodrag">
                    <Select
                        popupClassName="node-dropdown"
                        dropdownMatchSelectWidth={false}
                        value={data.targetParameter}
                        onChange={(value) => handleDataChange({ targetParameter: value })}
                        placeholder="目标变量"
                        style={{ width: '45%' }}
                        size="small"
                        status={!data.targetParameter ? 'warning' : ''}
                    >
                        {variables.filter(v => v.category === 'OUTPUT' || v.category === 'INTERNAL').map(v => (
                            <Select.Option key={v.code} value={v.code}>
                                {v.name}
                            </Select.Option>
                        ))}
                    </Select>
                    <Input
                        style={{ width: '10%', textAlign: 'center', pointerEvents: 'none', backgroundColor: '#fafafa', color: '#8c8c8c', fontSize: 10, padding: 0 }}
                        placeholder="="
                        disabled
                    />
                    <Input
                        value={data.assignmentValue}
                        onChange={(e) => handleDataChange({ assignmentValue: e.target.value })}
                        placeholder="赋值"
                        style={{ width: '45%' }}
                        size="small"
                    />
                </Space.Compact>

                {selectedVar && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 10, marginRight: 4 }}>{selectedVar.code}</Text>
                        <Tag color="green" style={{ fontSize: 10, margin: 0, lineHeight: '16px', padding: '0 4px' }}>{selectedVar.type}</Tag>
                    </div>
                )}
            </Space>
        </BaseNode>
    );
};

export default memo(ActionNode);
