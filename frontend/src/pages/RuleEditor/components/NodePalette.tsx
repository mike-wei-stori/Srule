import {
  BranchesOutlined,
  CodeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PartitionOutlined,
  PlayCircleOutlined,
  SyncOutlined,
  TableOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Card, Space, Tooltip, Typography } from 'antd';
import React, { useState } from 'react';

const { Text } = Typography;

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

const NodePalette: React.FC<NodePaletteProps> = ({ onDragStart }) => {
  const intl = useIntl();
  const [collapsed, setCollapsed] = useState(true);

  const nodeTypes = [
    {
      type: 'DECISION',
      label: intl.formatMessage({ id: 'pages.editor.node.decision' }),
      icon: <BranchesOutlined />,
      color: '#00f3ff',
      description: intl.formatMessage({
        id: 'pages.editor.node.decision.desc',
      }),
    },
    {
      type: 'ACTION',
      label: intl.formatMessage({ id: 'pages.editor.node.action' }),
      icon: <ThunderboltOutlined />,
      color: '#bc13fe',
      description: intl.formatMessage({
        id: 'pages.editor.node.action.desc',
      }),
    },
    {
      type: 'SWITCH',
      label: intl.formatMessage({
        id: 'pages.editor.node.switch',
        defaultMessage: 'Switch',
      }),
      icon: <PartitionOutlined />,
      color: '#13c2c2',
      description: intl.formatMessage({
        id: 'pages.editor.node.switch.desc',
        defaultMessage: 'Multi-branch switch',
      }),
    },
    {
      type: 'DECISION_TABLE',
      label: intl.formatMessage({
        id: 'pages.editor.node.decisionTable',
        defaultMessage: 'Decision Table',
      }),
      icon: <TableOutlined />,
      color: '#722ed1',
      description: intl.formatMessage({
        id: 'pages.editor.node.decisionTable.desc',
        defaultMessage: 'Complex routing table',
      }),
    },
    {
      type: 'LOOP',
      label: intl.formatMessage({ id: 'pages.editor.node.loop' }),
      icon: <SyncOutlined />,
      color: '#13c2c2',
      description: intl.formatMessage({ id: 'pages.editor.node.loop.desc' }),
    },
    {
      type: 'SCRIPT',
      label: intl.formatMessage({ id: 'pages.editor.node.script' }),
      icon: <CodeOutlined />,
      color: '#722ed1',
      description: intl.formatMessage({
        id: 'pages.editor.node.script.desc',
      }),
    },
  ];

  return (
    <div
      style={{
        width: collapsed ? 60 : 240,
        height: '100%',
        borderRight: '1px solid var(--glass-border)',
        background: 'var(--bg-secondary)',
        padding: collapsed ? 8 : 16,
        overflowY: 'auto',
        transition: 'width 0.3s ease',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: collapsed ? '50%' : 10,
          transform: collapsed ? 'translateX(50%)' : 'none',
          zIndex: 10,
        }}
      >
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          size="small"
          style={{ color: 'var(--text-primary)' }}
        />
      </div>

      <div
        style={{
          marginBottom: 16,
          marginTop: 48,
          textAlign: collapsed ? 'center' : 'left',
        }}
      >
        {!collapsed && (
          <Text strong style={{ fontSize: 16, color: 'var(--primary-color)' }}>
            <PlayCircleOutlined />{' '}
            {intl.formatMessage({ id: 'pages.editor.nodePalette' })}
          </Text>
        )}
        {collapsed && (
          <Tooltip
            title={intl.formatMessage({ id: 'pages.editor.nodePalette' })}
            placement="right"
          >
            <PlayCircleOutlined
              style={{ fontSize: 20, color: 'var(--primary-color)' }}
            />
          </Tooltip>
        )}

        {!collapsed && (
          <div
            style={{
              marginTop: 8,
              color: 'var(--text-secondary)',
              fontSize: 12,
            }}
          >
            {intl.formatMessage({ id: 'pages.editor.dragNode' })}
          </div>
        )}
      </div>

      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        {nodeTypes.map((node) => (
          <div key={node.type}>
            {collapsed ? (
              <Tooltip title={node.label} placement="right">
                <div
                  draggable
                  onDragStart={(e) => onDragStart(e, node.type)}
                  style={{
                    cursor: 'grab',
                    width: '100%',
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-card)',
                    border: 'var(--glass-border)',
                    borderLeft: `4px solid ${node.color}`,
                    borderRadius: 4,
                  }}
                >
                  <span style={{ fontSize: 20, color: node.color }}>
                    {node.icon}
                  </span>
                </div>
              </Tooltip>
            ) : (
              <Card
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
                    <Text strong style={{ color: 'var(--text-primary)' }}>
                      {node.label}
                    </Text>
                  </Space>
                  <Text
                    type="secondary"
                    style={{ fontSize: 12, color: 'var(--text-secondary)' }}
                  >
                    {node.description}
                  </Text>
                </Space>
              </Card>
            )}
          </div>
        ))}
      </Space>

      {!collapsed && (
        <div
          style={{
            marginTop: 24,
            padding: 12,
            background: 'rgba(0, 243, 255, 0.1)',
            borderRadius: 4,
            border: '1px solid rgba(0, 243, 255, 0.2)',
          }}
        >
          <Text style={{ fontSize: 12, color: 'var(--primary-color)' }}>
            {intl.formatMessage({ id: 'pages.editor.tip' })}
          </Text>
        </div>
      )}
    </div>
  );
};

export default NodePalette;
