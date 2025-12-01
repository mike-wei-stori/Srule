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
            // Check if key contains sourceHandle info (e.g. "addDecision:true")
            if (e.key.includes(':')) {
                const [action, sourceHandle] = e.key.split(':');
                data.onMenuClick(action, id, sourceHandle);
            } else {
                data.onMenuClick(e.key, id);
            }
        } else {
            console.error('data.onMenuClick is undefined');
        }
    };

    const getMenuItems = (): MenuProps['items'] => {
        const items: MenuProps['items'] = [];

        // Add Child Node Submenu
        const addChildItems: MenuProps['items'] = [];
        const nodeTypes = [
            { type: 'DECISION', label: intl.formatMessage({ id: 'pages.editor.node.decision', defaultMessage: 'Decision Node' }), action: 'addDecision' },
            { type: 'ACTION', label: intl.formatMessage({ id: 'pages.editor.node.action', defaultMessage: 'Action Node' }), action: 'addAction' },
            { type: 'SWITCH', label: intl.formatMessage({ id: 'pages.editor.node.switch', defaultMessage: 'Switch Node' }), action: 'addSwitch' },
            { type: 'DECISION_TABLE', label: intl.formatMessage({ id: 'pages.editor.node.decisionTable', defaultMessage: 'Decision Table Node' }), action: 'addDecisionTable' },
            { type: 'SCRIPT', label: intl.formatMessage({ id: 'pages.editor.node.script', defaultMessage: 'Script Node' }), action: 'addScript' },
            { type: 'LOOP', label: intl.formatMessage({ id: 'pages.editor.node.loop', defaultMessage: 'Loop Node' }), action: 'addLoop' },
            { type: 'RULE_PACKAGE', label: intl.formatMessage({ id: 'pages.editor.node.rulePackage', defaultMessage: 'Rule Package Node' }), action: 'addRulePackage' }
        ];

        nodeTypes.forEach(nt => {
            if (data.type === 'DECISION') {
                // For Decision Node, allow choosing True or False branch
                addChildItems.push({
                    key: nt.action,
                    label: nt.label,
                    children: [
                        { key: `${nt.action}:true`, label: 'True' },
                        { key: `${nt.action}:false`, label: 'False' }
                    ]
                });
            } else if (data.type === 'SWITCH') {
                const switchChildren: MenuProps['items'] = [];
                // Add cases
                if (data.cases && Array.isArray(data.cases)) {
                    data.cases.forEach((c: any) => {
                        switchChildren.push({ key: `${nt.action}:${c.id}`, label: c.value || 'Case' });
                    });
                }
                // Add default
                switchChildren.push({ key: `${nt.action}:default`, label: intl.formatMessage({ id: 'pages.editor.node.switch.default', defaultMessage: 'Default' }) });

                addChildItems.push({
                    key: nt.action,
                    label: nt.label,
                    children: switchChildren
                });
            } else if (data.type === 'DECISION_TABLE') {
                const dtChildren: MenuProps['items'] = [];
                if (data.branches && Array.isArray(data.branches)) {
                    data.branches.forEach((b: any, index: number) => {
                        let label = `Branch ${index + 1}`;
                        if (b.type === 'EXPRESSION') {
                            label = b.expression || label;
                        } else {
                            label = `${b.operator || '=='} ${b.value || ''}`;
                        }
                        // Truncate label if too long
                        if (label.length > 20) label = label.substring(0, 20) + '...';

                        dtChildren.push({ key: `${nt.action}:${b.id}`, label });
                    });
                }

                addChildItems.push({
                    key: nt.action,
                    label: nt.label,
                    children: dtChildren
                });
            } else {
                addChildItems.push({ key: nt.action, label: nt.label });
            }
        });

        items.push({
            key: 'addChild',
            label: intl.formatMessage({ id: 'pages.editor.node.addChild', defaultMessage: 'Add Child Node' }),
            icon: <PlusOutlined />,
            children: addChildItems
        });

        if (data.type === 'DECISION') {
            items.push({ key: 'addCondition', label: intl.formatMessage({ id: 'pages.editor.node.addCondition' }), icon: <PlusOutlined /> });
        }

        items.push({ type: 'divider' });

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
            {data.type !== 'START' && <Handle type="target" position={Position.Left} className="custom-node-handle" style={{ background: 'var(--primary-color)' }} />}
            <Dropdown
                menu={{
                    items: getMenuItems(),
                    onClick: handleMenuClick
                }}
                trigger={['contextMenu']}
                disabled={data.readonly} // Disable context menu if readonly
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
                        cursor: data.readonly ? 'default' : 'pointer', // Change cursor
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
                                    editable={!data.readonly && { // Disable editing if readonly
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
            {sourceHandles || <Handle type="source" position={Position.Right} className="custom-node-handle" style={{ background: 'var(--primary-color)' }} />}
        </div>
    );
};
