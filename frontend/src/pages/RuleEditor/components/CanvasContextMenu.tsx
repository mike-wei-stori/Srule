import React, { useCallback } from 'react';
import { Menu, MenuProps } from 'antd';
import {
    SnippetsOutlined,
    BranchesOutlined,
    FilterOutlined,
    ThunderboltOutlined,
    CodeOutlined,
    SyncOutlined
} from '@ant-design/icons';

interface CanvasContextMenuProps {
    visible: boolean;
    position: { x: number; y: number };
    onClose: () => void;
    onPaste: (position?: { x: number; y: number }) => void;
    onAddNode: (type: string, position: { x: number; y: number }) => void;
}

const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
    visible,
    position,
    onClose,
    onPaste,
    onAddNode
}) => {
    if (!visible) return null;

    const handleMenuClick = (e: any) => {
        e.domEvent.stopPropagation();

        if (e.key === 'paste') {
            onPaste(position);
        } else if (e.key.startsWith('add_')) {
            const type = e.key.replace('add_', '');
            onAddNode(type, position);
        }

        onClose();
    };

    const items: MenuProps['items'] = [
        {
            key: 'paste',
            label: '粘贴节点',
            icon: <SnippetsOutlined />
        },
        {
            type: 'divider'
        },
        {
            key: 'add_DECISION',
            label: '添加决策节点',
            icon: <BranchesOutlined style={{ color: '#1890ff' }} />
        },
        {
            key: 'add_ACTION',
            label: '添加动作节点',
            icon: <ThunderboltOutlined style={{ color: '#52c41a' }} />
        },
        {
            key: 'add_SCRIPT',
            label: '添加脚本节点',
            icon: <CodeOutlined style={{ color: '#722ed1' }} />
        },
        {
            key: 'add_LOOP',
            label: '添加循环节点',
            icon: <SyncOutlined style={{ color: '#13c2c2' }} />
        }
    ];

    return (
        <div
            style={{
                position: 'fixed',
                top: position.y,
                left: position.x,
                zIndex: 1000,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                borderRadius: 4,
                background: '#fff'
            }}
        >
            <Menu
                items={items}
                onClick={handleMenuClick}
                style={{ borderRadius: 4, border: 'none' }}
            />
            {/* Overlay to close menu when clicking outside */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: -1
                }}
                onClick={onClose}
                onContextMenu={(e) => {
                    e.preventDefault();
                    onClose();
                }}
            />
        </div>
    );
};

export default CanvasContextMenu;
