import React, { useEffect, useState } from 'react';
import { Drawer, List, Button, Tag, Space, Popconfirm, message, Checkbox, Tooltip } from 'antd';
import { DiffOutlined, SwapOutlined } from '@ant-design/icons';
import { getVersions, rollbackVersion, activateVersion } from '@/services/RulePackageVersionController';
import dayjs from 'dayjs';
import VersionDiffModal from './VersionDiffModal';

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

    // Comparison State
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [selectedVersionIds, setSelectedVersionIds] = useState<number[]>([]);
    const [diffModalVisible, setDiffModalVisible] = useState(false);

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
            // Reset comparison state when opening
            setIsCompareMode(false);
            setSelectedVersionIds([]);
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

    const toggleCompareMode = () => {
        setIsCompareMode(!isCompareMode);
        setSelectedVersionIds([]);
    };

    const handleSelectVersion = (id: number) => {
        if (selectedVersionIds.includes(id)) {
            setSelectedVersionIds(selectedVersionIds.filter(v => v !== id));
        } else {
            if (selectedVersionIds.length >= 2) {
                message.warning('You can only compare 2 versions');
                return;
            }
            setSelectedVersionIds([...selectedVersionIds, id]);
        }
    };

    const handleCompare = () => {
        if (selectedVersionIds.length !== 2) {
            message.warning('Please select exactly 2 versions to compare');
            return;
        }
        setDiffModalVisible(true);
    };

    const getSelectedVersions = () => {
        if (selectedVersionIds.length !== 2) return { base: null, target: null };
        // Sort by ID or CreatedAt to determine Base (older) and Target (newer)
        const selected = versions.filter(v => selectedVersionIds.includes(v.id));
        // Assuming higher ID is newer, or sort by createdAt
        selected.sort((a, b) => {
            const timeA = new Date(a.createdAt || a.createTime || 0).getTime();
            const timeB = new Date(b.createdAt || b.createTime || 0).getTime();
            return timeA - timeB;
        });
        return { base: selected[0], target: selected[1] };
    };

    const { base, target } = getSelectedVersions();

    return (
        <>
            <Drawer
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Version Management</span>
                        <Space>
                            {isCompareMode ? (
                                <>
                                    <Button
                                        type="primary"
                                        size="small"
                                        disabled={selectedVersionIds.length !== 2}
                                        onClick={handleCompare}
                                        icon={<DiffOutlined />}
                                    >
                                        Compare
                                    </Button>
                                    <Button size="small" onClick={toggleCompareMode}>Cancel</Button>
                                </>
                            ) : (
                                <Button
                                    size="small"
                                    icon={<SwapOutlined />}
                                    onClick={toggleCompareMode}
                                >
                                    Compare Versions
                                </Button>
                            )}
                        </Space>
                    </div>
                }
                placement="right"
                onClose={onClose}
                open={visible}
                width={450}
            >
                <List
                    loading={loading}
                    itemLayout="vertical"
                    dataSource={versions}
                    renderItem={(item) => (
                        <List.Item
                            style={{
                                background: selectedVersionIds.includes(item.id) ? '#e6f7ff' : 'transparent',
                                transition: 'background 0.3s'
                            }}
                            actions={!isCompareMode ? [
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
                            ] : []}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                {isCompareMode && (
                                    <Checkbox
                                        checked={selectedVersionIds.includes(item.id)}
                                        onChange={() => handleSelectVersion(item.id)}
                                        style={{ marginTop: 8, marginRight: 12 }}
                                    />
                                )}
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
                                                {dayjs(item.createdAt || item.createTime).format('YYYY-MM-DD HH:mm:ss')} by {item.createdBy || 'System'}
                                            </div>
                                        </div>
                                    }
                                />
                            </div>
                        </List.Item>
                    )}
                />
            </Drawer>

            {diffModalVisible && base && target && (
                <VersionDiffModal
                    visible={diffModalVisible}
                    onClose={() => setDiffModalVisible(false)}
                    baseVersion={base}
                    targetVersion={target}
                />
            )}
        </>
    );
};

export default VersionListDrawer;

