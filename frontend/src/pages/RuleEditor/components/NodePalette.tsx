import React from 'react';
import { Card, Space, Typography } from 'antd';
import {
    BranchesOutlined,
    FilterOutlined,
    ThunderboltOutlined,
    PlayCircleOutlined,
    CodeOutlined,
    SyncOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface NodePaletteProps {
    onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

const NodePalette: React.FC<NodePaletteProps> = ({ onDragStart }) => {
    const nodeTypes = [
        {
            type: 'DECISION',
            label: '决策节点',
            icon: <BranchesOutlined />,
            color: '#1890ff',
            description: '根据变量值进行分支决策'
        },
        {
            type: 'ACTION',
            label: '动作节点',
            icon: <ThunderboltOutlined />,
            color: '#52c41a',
            description: '执行赋值或其他操作'
        },
        {
            type: 'SCRIPT',
            label: '脚本节点',
            icon: <CodeOutlined />,
            color: '#722ed1',
            description: '执行自定义脚本'
        },
        {
            type: 'LOOP',
            label: '循环节点',
            icon: <SyncOutlined />,
            color: '#13c2c2',
            description: '遍历集合变量'
        }
    ];

    return (
        <div style={{
            width: 240,
            height: '100%',
            borderRight: '1px solid #f0f0f0',
            background: '#fafafa',
            padding: 16,
            overflowY: 'auto'
        }}>
            <div style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 16 }}>
                    <PlayCircleOutlined /> 节点面板
                </Text>
                <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 12 }}>
                    拖拽节点到画布
                </div>
            </div>

            <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {nodeTypes.map((node) => (
                    <Card
                        key={node.type}
                        size="small"
                        draggable
                        onDragStart={(e) => onDragStart(e, node.type)}
                        style={{
                            cursor: 'grab',
                            borderLeft: `4px solid ${node.color}`,
                            transition: 'all 0.3s',
                        }}
                        hoverable
                        bodyStyle={{ padding: 12 }}
                    >
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                            <Space>
                                <span style={{ fontSize: 18, color: node.color }}>
                                    {node.icon}
                                </span>
                                <Text strong>{node.label}</Text>
                            </Space>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {node.description}
                            </Text>
                        </Space>
                    </Card>
                ))}
            </Space>

            <div style={{
                marginTop: 24,
                padding: 12,
                background: '#e6f7ff',
                borderRadius: 4,
                border: '1px solid #91d5ff'
            }}>
                <Text style={{ fontSize: 12, color: '#0050b3' }}>
                    💡 提示：拖拽节点到画布上，然后右键点击节点可以查看更多操作
                </Text>
            </div>
        </div>
    );
};

export default NodePalette;
