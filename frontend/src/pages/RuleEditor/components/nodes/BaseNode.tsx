import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Dropdown, MenuProps, Typography, message } from 'antd';
import { PlusOutlined, DeleteOutlined, CopyOutlined, UpOutlined, DownOutlined, EditOutlined } from '@ant-design/icons';

import { useIntl } from '@umijs/max';

interface BaseNodeProps extends NodeProps {
    children: React.ReactNode;
    style?: React.CSSProperties;
    sourceHandles?: React.ReactNode;
}

export const BaseNode = (props: BaseNodeProps) => {
    const { id, data, selected, children, style, sourceHandles } = props;
    const intl = useIntl();

    const handleMenuClick = (e: any) => {
        console.log('BaseNode handleMenuClick:', e.key, id);
        if (data.onMenuClick) {
            data.onMenuClick(e.key, id);
        } else {
            console.error('data.onMenuClick is undefined');
        }
    };

    const getMenuItems = (): MenuProps['items'] => {
        const items: MenuProps['items'] = [];

        if (data.type === 'DECISION') {
            items.push({ key: 'addCondition', label: intl.formatMessage({ id: 'pages.editor.node.addCondition' }), icon: <PlusOutlined /> });
        }

        if (['DECISION', 'ACTION'].includes(data.type)) {
            items.push({ type: 'divider' });
        }

        items.push({ key: 'moveUp', label: intl.formatMessage({ id: 'pages.editor.node.moveUp' }), icon: <UpOutlined /> });
        items.push({ key: 'moveDown', label: intl.formatMessage({ id: 'pages.editor.node.moveDown' }), icon: <DownOutlined /> });
        items.push({ type: 'divider' });
        items.push({ key: 'copy', label: intl.formatMessage({ id: 'pages.editor.node.copy' }), icon: <CopyOutlined /> });
        items.push({ key: 'delete', label: intl.formatMessage({ id: 'pages.editor.node.delete' }), icon: <DeleteOutlined />, danger: true });

        return items;
    };

    const getBorderColor = () => {
        if (selected) return 'var(--primary-color)';
        switch (data.type) {
            case 'DECISION': return '#00f3ff';
            case 'CONDITION': return '#fa8c16';
            case 'ACTION': return '#bc13fe';
            default: return 'var(--border-color)';
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            {data.type !== 'START' && <Handle type="target" position={Position.Left} style={{ width: 8, height: 8, background: 'var(--primary-color)' }} />}
            <Dropdown
                menu={{
                    items: getMenuItems(),
                    onClick: handleMenuClick
                }}
                trigger={['contextMenu']}
            >
                <div
                    onContextMenu={(e) => {
                        e.preventDefault();
                    }}
                    style={{
                        padding: 0,
                        background: 'var(--bg-card)',
                        backdropFilter: 'blur(10px)',
                        border: selected ? `2px solid ${getBorderColor()}` : `1px solid ${getBorderColor()}`,
                        borderRadius: 12,
                        cursor: 'pointer',
                        minWidth: 200,
                        maxWidth: 350,
                        width: 'fit-content',
                        boxShadow: selected
                            ? 'var(--neon-glow)'
                            : '0 4px 12px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: selected ? 'translateY(-4px)' : 'translateY(0)',
                        // overflow: 'hidden', // Removed to allow dropdowns to overflow if needed
                        color: 'var(--text-primary)',
                        ...style
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '8px 16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderBottom: 'var(--glass-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ fontWeight: 500, color: 'var(--primary-color)', flex: 1, marginRight: 8 }}>
                            {data.type === 'START' ? (
                                <span>{data.label}</span>
                            ) : (
                                <Typography.Text
                                    editable={{
                                        onChange: (val: string) => {
                                            if (data.validateNodeName) {
                                                const error = data.validateNodeName(val, id);
                                                if (error) {
                                                    message.error(error);
                                                    return;
                                                }
                                            }
                                            if (data.onChange) {
                                                data.onChange(id, { ...data, label: val });
                                            }
                                        },
                                        triggerType: ['text', 'icon'],
                                        icon: <EditOutlined style={{ color: 'var(--primary-color)' }} />
                                    }}
                                    style={{ width: '100%', color: 'var(--primary-color)' }}
                                    ellipsis={{ tooltip: true }}
                                >
                                    {data.label}
                                </Typography.Text>
                            )}
                        </div>

                    </div>

                    {/* Content */}
                    <div style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>
                        {children && React.Children.toArray(children).slice(1)} {/* Rest of content */}
                    </div>
                </div>
            </Dropdown>
            {sourceHandles || <Handle type="source" position={Position.Right} style={{ width: 8, height: 8, background: 'var(--primary-color)' }} />}
        </div>
    );
};
