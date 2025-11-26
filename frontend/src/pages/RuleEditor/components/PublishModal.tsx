import React, { useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { createVersion } from '@/services/RulePackageVersionController';

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

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            await createVersion(packageId, {
                ...values,
                contentJson,
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

    return (
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
            </Form>
        </Modal>
    );
};

export default PublishModal;

