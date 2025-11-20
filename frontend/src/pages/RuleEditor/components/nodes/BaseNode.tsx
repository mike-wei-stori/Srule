import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Dropdown, MenuProps, Typography, message } from 'antd';
import { PlusOutlined, DeleteOutlined, CopyOutlined, UpOutlined, DownOutlined, EditOutlined } from '@ant-design/icons';

interface BaseNodeProps extends NodeProps {
    children: React.ReactNode;
    style?: React.CSSProperties;
    sourceHandles?: React.ReactNode;
}

export const BaseNode = (props: BaseNodeProps) => {
    const { id, data, selected, children, style, sourceHandles } = props;

    const handleMenuClick = (e: any) => {
        if (data.onMenuClick) {
            data.onMenuClick(e.key, id);
        }
    };

    const getMenuItems = (): MenuProps['items'] => {
        const items: MenuProps['items'] = [];

        if (data.type === 'DECISION') {
            items.push({ key: 'addCondition', label: '添加条件', icon: <PlusOutlined /> });
        }

        if (['DECISION', 'ACTION'].includes(data.type)) {
            items.push({ type: 'divider' });
        }

        items.push({ key: 'moveUp', label: '上移', icon: <UpOutlined /> });
        items.push({ key: 'moveDown', label: '下移', icon: <DownOutlined /> });
        items.push({ type: 'divider' });
        items.push({ key: 'copy', label: '复制', icon: <CopyOutlined /> });
        items.push({ key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true });

        return items;
    };

    const getBorderColor = () => {
        if (selected) return '#1890ff';
        switch (data.type) {
            case 'DECISION': return '#1890ff';
            case 'CONDITION': return '#fa8c16';
            case 'ACTION': return '#52c41a';
            default: return '#d9d9d9';
        }
    };



    return (
        <div style={{ position: 'relative' }}>
            {data.type !== 'START' && <Handle type="target" position={Position.Left} style={{ width: 8, height: 8, background: '#8c8c8c' }} />}
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
                        background: '#fff',
                        border: selected ? `2px solid ${getBorderColor()}` : '1px solid #e0e0e0',
                        borderRadius: 12,
                        cursor: 'pointer',
                        minWidth: 200,
                        maxWidth: 300,
                        boxShadow: selected
                            ? '0 0 0 4px rgba(24, 144, 255, 0.2), 0 8px 24px rgba(0,0,0,0.12)'
                            : '0 4px 12px rgba(0,0,0,0.08)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: selected ? 'translateY(-4px)' : 'translateY(0)',
                        overflow: 'hidden',
                        ...style
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '8px 16px',
                        background: 'linear-gradient(to bottom, #fafafa, #f5f5f5)',
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ fontWeight: 500, color: '#262626', flex: 1, marginRight: 8 }}>
                            {data.type === 'START' ? (
                                <span>{data.label}</span>
                            ) : (
                                <Typography.Text
                                    editable={{
                                        onChange: (val: string) => {
                                            if (data.validateNodeName) {
                                                const error = data.validateNodeName(val, id);
                                                if (error) {
                                                    // Show error and do not update
                                                    // We need to import message from antd, but it might be better to use a callback or just let the parent handle it?
                                                    // Since we are in a node, we can't easily access the global message instance if not imported.
                                                    // Let's assume message is available or we just console error/alert for now, 
                                                    // but better: The parent passed validateNodeName which returns a string.
                                                    // We should probably trigger a UI feedback. 
                                                    // For now, let's just NOT update if invalid.
                                                    // Ideally we should show why.
                                                    message.error(error);
                                                    return;
                                                }
                                            }
                                            if (data.onChange) {
                                                data.onChange(id, { ...data, label: val });
                                            }
                                        },
                                        triggerType: ['text', 'icon'],
                                    }}
                                    style={{ width: '100%' }}
                                    ellipsis={{ tooltip: true }}
                                >
                                    {data.label}
                                </Typography.Text>
                            )}
                        </div>

                    </div>

                    {/* Content */}
                    <div style={{ padding: '8px 12px' }}>
                        {children && React.Children.toArray(children).slice(1)} {/* Rest of content */}
                    </div>
                </div>
            </Dropdown>
            {sourceHandles || <Handle type="source" position={Position.Right} style={{ width: 8, height: 8, background: '#8c8c8c' }} />}
        </div>
    );
};
