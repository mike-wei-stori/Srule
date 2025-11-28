import React, { useState } from 'react';
import { Modal, Form, Input, message, Select, Button } from 'antd';
import { createVersion, getVersions } from '@/services/RulePackageVersionController';
import { previewPackageGraph, loadPackageGraph } from '@/services/RulePackageController';
import VersionDiffModal from './VersionDiffModal';

interface PublishModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    packageId: number;
    contentJson?: string;
}

const PublishModal: React.FC<PublishModalProps> = ({ visible, onCancel, onSuccess, packageId, contentJson = '' }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [versions, setVersions] = useState<API.RulePackageVersion[]>([]);
    const [selectedVersionId, setSelectedVersionId] = useState<number>();
    const [diffVisible, setDiffVisible] = useState(false);
    const [fetchedContentJson, setFetchedContentJson] = useState<string>('');

    React.useEffect(() => {
        if (visible && packageId) {
            getVersions(packageId).then(res => {
                if (res.data) {
                    setVersions(res.data);
                }
            });

            if (!contentJson) {
                loadPackageGraph(packageId).then(res => {
                    if (res.data) {
                        setFetchedContentJson(JSON.stringify(res.data));
                    }
                });
            }
        }
    }, [visible, packageId, contentJson]);

    const effectiveContentJson = contentJson || fetchedContentJson;

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            await createVersion(packageId, {
                ...values,
                contentJson: effectiveContentJson,
            });
            message.success('Published successfully');
            onSuccess();
            onCancel();
        } catch (e) {
            // Error
        } finally {
            setLoading(false);
        }
    };

    const handleCompare = async () => {
        if (!selectedVersionId) {
            message.warning('Please select a version to compare');
            return;
        }

        try {
            console.log('PublishModal contentJson:', effectiveContentJson);
            if (!effectiveContentJson) {
                message.error('Graph data is empty');
                return;
            }
            // Fetch preview data (DRL) for current draft
            const graphData = JSON.parse(effectiveContentJson);
            const res = await previewPackageGraph({ packageId, graphData });

            if (res.data) {
                // Construct a temporary version object for the current draft with snapshot data
                const currentDraftVersion: any = {
                    version: 'Current Draft',
                    contentJson: effectiveContentJson,
                    snapshotData: JSON.stringify(res.data), // Use the preview data as snapshot
                    createdAt: new Date().toISOString(),
                    createdBy: 'You',
                };
                setTargetVersion(currentDraftVersion);
                setDiffVisible(true);
            } else {
                message.error((res as any).message || (res as any).msg || 'Failed to generate preview');
            }
        } catch (e: any) {
            console.error('Preview error:', e);
            message.error('Failed to generate preview: ' + (e.message || 'Unknown error'));
        }
    };

    const selectedVersion = versions.find(v => v.id === selectedVersionId);
    const [targetVersion, setTargetVersion] = useState<any>(null);

    return (
        <>
            <Modal
                title="Publish Version"
                open={visible}
                onOk={handleOk}
                onCancel={onCancel}
                confirmLoading={loading}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="version"
                        label="Version Number"
                        rules={[{ required: true, message: 'Please input version number' }]}
                    >
                        <Input placeholder="e.g. 1.0.0" />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <Input.TextArea placeholder="Description of this version" />
                    </Form.Item>

                    <Form.Item label="Compare with History">
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Select
                                style={{ flex: 1 }}
                                placeholder="Select a version to compare"
                                onChange={setSelectedVersionId}
                                value={selectedVersionId}
                            >
                                {versions.map(v => (
                                    <Select.Option key={v.id} value={v.id}>
                                        {v.version} - {v.description || 'No description'}
                                    </Select.Option>
                                ))}
                            </Select>
                            <Button onClick={handleCompare} disabled={!selectedVersionId}>
                                Compare
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>

            {diffVisible && (
                <VersionDiffModal
                    visible={diffVisible}
                    onClose={() => setDiffVisible(false)}
                    baseVersion={selectedVersion || null}
                    targetVersion={targetVersion}
                />
            )}
        </>
    );
};

export default PublishModal;

