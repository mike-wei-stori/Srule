import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Divider } from 'antd';
import { Node } from 'reactflow';
import { request } from '@umijs/max';
import { getVariablesByPackage } from '@/services/RuleVariableController';

interface NodeEditModalProps {
    visible: boolean;
    node: Node | null;
    onCancel: () => void;
    onSave: (id: string, data: any) => void;
    packageId?: number | null;
}

const NodeEditModal: React.FC<NodeEditModalProps> = ({ visible, node, onCancel, onSave, packageId }) => {
    const [form] = Form.useForm();
    const [variables, setVariables] = useState<API.RuleVariable[]>([]);

    useEffect(() => {
        if (packageId && visible) {
            const fetchVariables = async () => {
                try {
                    const res = await getVariablesByPackage(packageId);
                    setVariables((res.data as API.RuleVariable[]) || []);
                } catch (e) {
                    // Ignore
                }
            };
            fetchVariables();
        }
    }, [packageId, visible]);

    useEffect(() => {
        if (node && visible) {
            form.setFieldsValue(node.data);
        } else {
            form.resetFields();
        }
    }, [node, visible, form]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            if (node) {
                onSave(node.id, { ...node.data, ...values });
            }
        } catch (e) {
            // Validation failed
        }
    };

    if (!node) return null;

    const nodeType = node.data?.type || node.type;

    return (
        <Modal
            title={`Edit ${nodeType} Node`}
            open={visible}
            onOk={handleOk}
            onCancel={onCancel}
            destroyOnClose
        >
            <Form form={form} layout="vertical">
                <Form.Item name="label" label="Label" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>

                <Divider />

                {nodeType === 'CONDITION' && (
                    <>
                        <Form.Item name="parameter" label="Parameter">
                            <Select placeholder="Select Parameter">
                                {variables.map(v => (
                                    <Select.Option key={v.code} value={v.code}>
                                        {v.name} ({v.code})
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item name="operator" label="Operator">
                            <Select>
                                <Select.Option value="==">Equals (==)</Select.Option>
                                <Select.Option value="!=">Not Equals (!=)</Select.Option>
                                <Select.Option value=">">Greater Than (&gt;)</Select.Option>
                                <Select.Option value="<">Less Than (&lt;)</Select.Option>
                                <Select.Option value=">=">Greater Or Equal (&gt;=)</Select.Option>
                                <Select.Option value="<=">Less Or Equal (&lt;=)</Select.Option>
                                <Select.Option value="contains">Contains</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="value" label="Value">
                            <Input placeholder="Value (e.g. 18, 'active')" />
                        </Form.Item>
                    </>
                )}

                {nodeType === 'DECISION' && (
                    <>
                        <Form.Item name="parameter" label="Decision Parameter">
                            <Select placeholder="Select Parameter to Split On">
                                {variables.map(v => (
                                    <Select.Option key={v.code} value={v.code}>
                                        {v.name} ({v.code})
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <p style={{ color: '#999', fontSize: '12px' }}>
                            Define conditions on the outgoing edges by clicking on them.
                        </p>
                    </>
                )}

                {nodeType === 'ACTION' && (
                    <>
                        <Form.Item name="targetParameter" label="Target Parameter">
                            <Select placeholder="Select Output Parameter">
                                {variables.filter(v => v.category === 'OUTPUT' || v.category === 'INTERNAL').map(v => (
                                    <Select.Option key={v.code} value={v.code}>
                                        {v.name} ({v.code})
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item name="assignmentValue" label="Assignment Value">
                            <Input placeholder="Value or Expression" />
                        </Form.Item>
                    </>
                )}

                {nodeType === 'SCORING' && (
                    <>
                        <Form.Item name="targetParameter" label="Target Parameter">
                            <Select placeholder="Select Output Parameter">
                                {variables.filter(v => v.category === 'OUTPUT' || v.category === 'INTERNAL').map(v => (
                                    <Select.Option key={v.code} value={v.code}>
                                        {v.name} ({v.code})
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item name="operation" label="Operation">
                            <Select>
                                <Select.Option value="+">Add (+)</Select.Option>
                                <Select.Option value="-">Subtract (-)</Select.Option>
                                <Select.Option value="*">Multiply (*)</Select.Option>
                                <Select.Option value="/">Divide (/)</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="value" label="Value">
                            <Input placeholder="Numeric Value" />
                        </Form.Item>
                    </>
                )}

                {nodeType === 'SCRIPT' && (
                    <Form.Item name="scriptContent" label="Script Content">
                        <Input.TextArea
                            rows={6}
                            placeholder="Enter Java/Drools code here..."
                            style={{ fontFamily: 'monospace' }}
                        />
                    </Form.Item>
                )}

                {(nodeType !== 'CONDITION' && nodeType !== 'ACTION' && nodeType !== 'DECISION' && nodeType !== 'SCORING' && nodeType !== 'SCRIPT') && (
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                )}
            </Form>
        </Modal>
    );
};

export default NodeEditModal;
