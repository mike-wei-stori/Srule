import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { getUsers } from '@/services/UserController';

import { useIntl } from '@umijs/max';

interface RulePackageEditModalProps {
    visible: boolean;
    onCancel: () => void;
    onOk: (values: any) => void;
    initialValues?: any;
    loading?: boolean;
}

const RulePackageEditModal: React.FC<RulePackageEditModalProps> = ({
    visible,
    onCancel,
    onOk,
    initialValues,
    loading
}) => {
    const [form] = Form.useForm();
    const intl = useIntl();

    const [users, setUsers] = useState<API.User[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await getUsers({});
                if (res.data) {
                    setUsers(res.data);
                }
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        if (visible && initialValues) {
            // Transform owner string to array for Select
            const ownerArray = initialValues.owner ? initialValues.owner.split(',') : [];
            form.setFieldsValue({
                ...initialValues,
                owner: ownerArray,
            });
        } else {
            form.resetFields();
        }
    }, [visible, initialValues, form]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            // Transform owner array back to string
            const formattedValues = {
                ...values,
                owner: values.owner ? values.owner.join(',') : '',
            };
            onOk(formattedValues);
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    return (
        <Modal
            title="Edit Package Info"
            open={visible}
            onOk={handleOk}
            onCancel={onCancel}
            confirmLoading={loading}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={initialValues}
            >
                <Form.Item
                    name="name"
                    label="Package Name"
                    rules={[{ required: true, message: 'Please enter package name' }]}
                >
                    <Input placeholder="Enter package name" />
                </Form.Item>

                <Form.Item
                    name="code"
                    label="Package Code"
                    rules={[{ required: true, message: 'Please enter package code' }]}
                >
                    <Input disabled placeholder="Package code cannot be changed" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Description"
                >
                    <Input.TextArea rows={4} placeholder="Enter description" />
                </Form.Item>

                <Form.Item
                    name="owner"
                    label={intl.formatMessage({ id: 'common.owner' })}
                >
                    <Select
                        mode="multiple"
                        placeholder="Select owners"
                        optionFilterProp="children"
                    >
                        {users.map(user => (
                            <Select.Option key={user.username} value={user.username}>
                                {user.nickname || user.username}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default RulePackageEditModal;
