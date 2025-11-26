import React, { memo, useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Select, Space, Typography, Tag } from 'antd';
import { SyncOutlined, DownOutlined } from '@ant-design/icons';
import { BaseNode } from './BaseNode';
import { getVariablesByPackage } from '@/services/RuleVariableController';

const { Text } = Typography;

const LoopNode = (props: NodeProps) => {
    const { id, data } = props;
    const [variables, setVariables] = useState<any[]>([]);
    const hasFetched = React.useRef(false);

    useEffect(() => {
        if (data.packageId && !hasFetched.current) {
            hasFetched.current = true;
            const fetchVariables = async () => {
                try {
                    const res = await getVariablesByPackage(data.packageId);
                    setVariables((res.data as any[]) || []);
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

    const selectedVar = variables.find(v => v.code === data.collectionVariable);

    const loopHandles = (
        <>
            <Handle
                type="source"
                position={Position.Right}
                id="loopBody"
                style={{ top: '30%', background: '#13c2c2' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="afterLoop"
                style={{ top: '70%', background: '#8c8c8c' }}
            />
        </>
    );

    return (
        <BaseNode {...props} sourceHandles={loopHandles}>
            <Space size={4}>
                <SyncOutlined style={{ color: '#13c2c2', fontSize: 14 }} />
                <Text type="secondary" style={{ fontSize: 11 }}>LOOP</Text>
            </Space>

            <Space direction="vertical" size={2} style={{ width: '100%' }} className="nodrag">
                <Select
                    popupClassName="node-dropdown"
                    dropdownMatchSelectWidth={false}
                    value={data.collectionVariable}
                    onChange={(value) => handleDataChange({ collectionVariable: value })}
                    placeholder="选择集合变量"
                    style={{ width: '100%' }}
                    size="small"
                    bordered={false}
                    suffixIcon={<DownOutlined style={{ fontSize: 10 }} />}
                >
                    {variables.filter(v => v.type.includes('List') || v.type.includes('Array') || v.type === 'LIST').map(v => (
                        <Select.Option key={v.code} value={v.code}>
                            {v.name}
                        </Select.Option>
                    ))}
                </Select>
                {selectedVar && (
                    <Tag color="cyan" style={{ fontSize: 10 }}>{selectedVar.type}</Tag>
                )}
                <div style={{ position: 'absolute', right: -10, top: '30%', fontSize: 10, color: '#13c2c2', transform: 'translate(100%, -50%)' }}>Body</div>
                <div style={{ position: 'absolute', right: -10, top: '70%', fontSize: 10, color: '#8c8c8c', transform: 'translate(100%, -50%)' }}>End</div>
            </Space>
        </BaseNode>
    );
};

export default memo(LoopNode);
