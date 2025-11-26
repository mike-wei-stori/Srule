import React, { useEffect, useState } from 'react';
import { Drawer, List, Button, Tag, Space, Popconfirm, message, Typography } from 'antd';
import { getVersions, rollbackVersion, activateVersion } from '@/services/RulePackageVersionController';
import dayjs from 'dayjs';

interface VersionListDrawerProps {
    visible: boolean;
    onClose: () => void;
    packageId: number;
    activeVersionId?: number; // Pass this if available in package details
    onVersionChange?: () => void;
}

const VersionListDrawer: React.FC<VersionListDrawerProps> = ({ visible, onClose, packageId, activeVersionId, onVersionChange }) => {
    const [loading, setLoading] = useState(false);
    const [versions, setVersions] = useState<API.RulePackageVersion[]>([]);
    const [currentActiveId, setCurrentActiveId] = useState<number | undefined>(activeVersionId);

    const fetchVersions = async () => {
        setLoading(true);
        try {
            const res = await getVersions(packageId);
            setVersions(res.data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible && packageId) {
            fetchVersions();
            // Also ideally we should refresh activeVersionId from parent or re-fetch package info
        }
    }, [visible, packageId]);
    
    // Update local active id when prop changes
    useEffect(() => {
        if (activeVersionId) setCurrentActiveId(activeVersionId);
    }, [activeVersionId]);

    const handleActivate = async (version: API.RulePackageVersion) => {
        try {
            await activateVersion(packageId, version.id);
            message.success(`Version ${version.version} activated`);
            setCurrentActiveId(version.id);
            if (onVersionChange) onVersionChange();
        } catch (e) {
            // Error handled by interceptor
        }
    };

    const handleRollback = async (version: API.RulePackageVersion) => {
        try {
            await rollbackVersion(packageId, version.id);
            message.success(`Rolled back to version ${version.version} (Draft updated)`);
            if (onVersionChange) onVersionChange();
        } catch (e) {
            // Error
        }
    };

    return (
        <Drawer
            title="Version Management"
            placement="right"
            onClose={onClose}
            open={visible}
            width={400}
        >
            <List
                loading={loading}
                itemLayout="vertical"
                dataSource={versions}
                renderItem={(item) => (
                    <List.Item
                        actions={[
                            <Popconfirm
                                title="Activate Version"
                                description="This will make this version live for production execution."
                                onConfirm={() => handleActivate(item)}
                                okText="Yes"
                                cancelText="No"
                                key="activate"
                            >
                                <Button type="link" size="small" disabled={currentActiveId === item.id}>
                                    {currentActiveId === item.id ? 'Active' : 'Activate'}
                                </Button>
                            </Popconfirm>,
                            <Popconfirm
                                title="Rollback Draft"
                                description="This will overwrite your current draft with this version's content."
                                onConfirm={() => handleRollback(item)}
                                okText="Yes"
                                cancelText="No"
                                key="rollback"
                            >
                                <Button type="link" size="small" danger>Rollback Draft</Button>
                            </Popconfirm>
                        ]}
                    >
                        <List.Item.Meta
                            title={
                                <Space>
                                    <span>{item.version}</span>
                                    {currentActiveId === item.id && <Tag color="green">Active</Tag>}
                                </Space>
                            }
                            description={
                                <div>
                                    <div>{item.description || 'No description'}</div>
                                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                                        {dayjs(item.createTime || item.createdAt).format('YYYY-MM-DD HH:mm:ss')} by {item.createdBy || 'System'}
                                    </div>
                                </div>
                            }
                        />
                    </List.Item>
                )}
            />
        </Drawer>
    );
};

export default VersionListDrawer;

