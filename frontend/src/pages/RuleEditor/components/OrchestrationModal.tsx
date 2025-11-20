import React, { useState, useEffect } from 'react';
import { Modal, List, Button, Space, Typography } from 'antd';
import { MenuOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { Node } from 'reactflow';

interface OrchestrationModalProps {
    visible: boolean;
    onClose: () => void;
    nodes: Node[];
    initialOrder: string[];
    onSave: (order: string[]) => void;
}

const OrchestrationModal: React.FC<OrchestrationModalProps> = ({ visible, onClose, nodes, initialOrder, onSave }) => {
    const [groups, setGroups] = useState<string[]>([]);

    useEffect(() => {
        if (visible) {
            // Extract unique agenda groups from nodes
            const nodeGroups = Array.from(new Set(
                nodes
                    .map(n => n.data.agendaGroup)
                    .filter(g => g && g.trim() !== '')
            )) as string[];

            // Merge with initial order to preserve existing order and add new ones
            const merged = [...initialOrder];
            nodeGroups.forEach(g => {
                if (!merged.includes(g)) {
                    merged.push(g);
                }
            });

            // Filter out groups that no longer exist in nodes (optional, maybe keep them?)
            // For now, let's keep them to avoid accidental data loss, or filter?
            // Better to filter to keep list clean, but warn? 
            // Let's filter to only show active groups + MAIN if implicit
            const activeGroups = merged.filter(g => nodeGroups.includes(g));

            // Ensure MAIN is always there if used or default?
            // If nodes have no group, they are MAIN. 
            if (!activeGroups.includes('MAIN') && nodes.some(n => !n.data.agendaGroup)) {
                activeGroups.unshift('MAIN');
            }

            setGroups(activeGroups);
        }
    }, [visible, nodes, initialOrder]);

    const move = (index: number, direction: 'up' | 'down') => {
        const newGroups = [...groups];
        if (direction === 'up' && index > 0) {
            [newGroups[index], newGroups[index - 1]] = [newGroups[index - 1], newGroups[index]];
        } else if (direction === 'down' && index < newGroups.length - 1) {
            [newGroups[index], newGroups[index + 1]] = [newGroups[index + 1], newGroups[index]];
        }
        setGroups(newGroups);
    };

    const handleSave = () => {
        onSave(groups);
        onClose();
    };

    return (
        <Modal
            title="Agenda Group Orchestration"
            open={visible}
            onCancel={onClose}
            onOk={handleSave}
            width={500}
        >
            <Typography.Paragraph type="secondary">
                Define the execution order of Agenda Groups. Groups at the top execute first.
            </Typography.Paragraph>
            <List
                bordered
                dataSource={groups}
                renderItem={(item, index) => (
                    <List.Item>
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Space>
                                <MenuOutlined style={{ color: '#bfbfbf', cursor: 'grab' }} />
                                <Typography.Text strong>{item}</Typography.Text>
                            </Space>
                            <Space>
                                <Button
                                    size="small"
                                    icon={<ArrowUpOutlined />}
                                    disabled={index === 0}
                                    onClick={() => move(index, 'up')}
                                />
                                <Button
                                    size="small"
                                    icon={<ArrowDownOutlined />}
                                    disabled={index === groups.length - 1}
                                    onClick={() => move(index, 'down')}
                                />
                            </Space>
                        </Space>
                    </List.Item>
                )}
            />
        </Modal>
    );
};

export default OrchestrationModal;
