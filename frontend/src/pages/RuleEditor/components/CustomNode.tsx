import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, Typography, Tag, Space } from 'antd';
import { CheckCircleOutlined, ThunderboltOutlined, SplitCellsOutlined, PlayCircleOutlined, CodeOutlined, CalculatorOutlined } from '@ant-design/icons';

const { Text } = Typography;

const CustomNode = ({ data, selected }: NodeProps) => {
    const type = data.type || 'DEFAULT';

    let icon = <PlayCircleOutlined />;
    let color = '#d9d9d9';
    let content = null;

    switch (type) {
        case 'CONDITION':
            icon = <CheckCircleOutlined style={{ color: '#52c41a' }} />;
            color = selected ? '#95de64' : '#f6ffed';
            if (data.parameter) {
                content = (
                    <Space size={4} style={{ fontSize: 12 }}>
                        <Tag color="blue">{data.parameter}</Tag>
                        <Text strong>{data.operator}</Text>
                        <Text>{data.value}</Text>
                    </Space>
                );
            }
            break;
        case 'ACTION':
            icon = <ThunderboltOutlined style={{ color: '#faad14' }} />;
            color = selected ? '#ffd666' : '#fffbe6';
            if (data.targetParameter) {
                content = (
                    <Space size={4} style={{ fontSize: 12 }}>
                        <Tag color="orange">{data.targetParameter}</Tag>
                        <Text>=</Text>
                        <Text>{data.assignmentValue}</Text>
                    </Space>
                );
            }
            break;
        case 'DECISION':
            icon = <SplitCellsOutlined style={{ color: '#1890ff' }} />;
            color = selected ? '#69c0ff' : '#e6f7ff';
            if (data.parameter) {
                content = <Tag color="blue">{data.parameter} ?</Tag>;
            }
            break;
        case 'START':
            color = selected ? '#ffccc7' : '#fff1f0';
            break;
    }

    return (
        <Card
            size="small"
            style={{
                minWidth: 180,
                maxWidth: 250,
                borderColor: selected ? '#1890ff' : '#d9d9d9',
                backgroundColor: color,
                borderRadius: 8,
                boxShadow: selected ? '0 0 0 2px rgba(24, 144, 255, 0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
                cursor: 'pointer'
            }}
            bodyStyle={{ padding: '8px 12px' }}
        >
            <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Space style={{ marginBottom: content ? 4 : 0 }}>
                    {icon}
                    <Text strong style={{ fontSize: 14 }}>{data.label}</Text>
                </Space>
                {content}
                {data.description && <Text type="secondary" style={{ fontSize: 10, marginTop: 4 }}>{data.description}</Text>}
            </div>
            <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
        </Card>
    );
};

export default memo(CustomNode);
