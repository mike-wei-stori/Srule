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
import { useIntl } from '@umijs/max';

const { Text } = Typography;

interface NodePaletteProps {
    onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

const NodePalette: React.FC<NodePaletteProps> = ({ onDragStart }) => {
    const intl = useIntl();

    const nodeTypes = [
        {
            type: 'DECISION',
            label: intl.formatMessage({ id: 'pages.editor.node.decision' }),
            icon: <BranchesOutlined />,
            color: '#00f3ff',
            description: intl.formatMessage({ id: 'pages.editor.node.decision.desc' })
        },
        {
            type: 'ACTION',
            label: intl.formatMessage({ id: 'pages.editor.node.action' }),
            icon: <ThunderboltOutlined />,
            color: '#bc13fe',
            description: intl.formatMessage({ id: 'pages.editor.node.action.desc' })
        },
        {
            type: 'SCRIPT',
            label: intl.formatMessage({ id: 'pages.editor.node.script' }),
            icon: <CodeOutlined />,
            color: '#722ed1',
            description: intl.formatMessage({ id: 'pages.editor.node.script.desc' })
        },
        {
            type: 'LOOP',
            label: intl.formatMessage({ id: 'pages.editor.node.loop' }),
            icon: <SyncOutlined />,
            color: '#13c2c2',
            description: intl.formatMessage({ id: 'pages.editor.node.loop.desc' })
        }
    ];

    return (
        <div style={{
            width: 240,
            height: '100%',
            borderRight: '1px solid var(--glass-border)',
            background: 'var(--bg-secondary)',
            padding: 16,
            overflowY: 'auto'
        }}>
            <div style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 16, color: 'var(--primary-color)' }}>
                    <PlayCircleOutlined /> {intl.formatMessage({ id: 'pages.editor.nodePalette' })}
                </Text>
                <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 12 }}>
                    {intl.formatMessage({ id: 'pages.editor.dragNode' })}
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
                            background: 'var(--bg-card)',
                            border: 'var(--glass-border)',
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
                                <Text strong style={{ color: 'var(--text-primary)' }}>{node.label}</Text>
                            </Space>
                            <Text type="secondary" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                {node.description}
                            </Text>
                        </Space>
                    </Card>
                ))}
            </Space>

            <div style={{
                marginTop: 24,
                padding: 12,
                background: 'rgba(0, 243, 255, 0.1)',
                borderRadius: 4,
                border: '1px solid rgba(0, 243, 255, 0.2)'
            }}>
                <Text style={{ fontSize: 12, color: 'var(--primary-color)' }}>
                    {intl.formatMessage({ id: 'pages.editor.tip' })}
                </Text>
            </div>
        </div>
    );
};

export default NodePalette;
