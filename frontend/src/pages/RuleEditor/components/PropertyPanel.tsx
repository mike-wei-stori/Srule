import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Button, Card, Divider } from 'antd';
import { Node } from 'reactflow';
import { request } from '@umijs/max';
import { getVariablesByPackage } from '@/services/RuleVariableController';

interface PropertyPanelProps {
    selectedNode: Node | null;
    onUpdate: (id: string, data: any) => void;
    packageId?: number | null;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ selectedNode, onUpdate, packageId }) => {
    const [form] = Form.useForm();
    const [variables, setVariables] = useState<API.RuleVariable[]>([]);

    useEffect(() => {
        if (packageId) {
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
    }, [packageId]);

    useEffect(() => {
        if (selectedNode) {
            form.setFieldsValue(selectedNode.data);
        } else {
            form.resetFields();
        }
    }, [selectedNode, form]);

    const handleFinish = (values: any) => {
        if (selectedNode) {
            onUpdate(selectedNode.id, { ...selectedNode.data, ...values });
        }
    };

    if (!selectedNode) {
        return (
            <Card title="Properties">
                <p>Select a node to edit properties</p>
            </Card>
        );
    }

    const nodeType = selectedNode.data?.type || selectedNode.type;

    return (
        <Card title="Properties">
            <Form form={form} onFinish={handleFinish} layout="vertical">
                <Form.Item name="label" label="Label">
                    <Input />
                </Form.Item>

                <Form.Item name="agendaGroup" label="Agenda Group" tooltip="Group rules for execution flow control. Default is 'MAIN'.">
                    <Input placeholder="e.g. GROUP_A" />
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
                        <Form.Item name="focusGroup" label="Next Agenda Group" tooltip="Switch focus to this group after action execution">
                            <Input placeholder="e.g. GROUP_B" />
                        </Form.Item>
                    </>
                )}

                {(nodeType !== 'CONDITION' && nodeType !== 'ACTION') && (
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                )}

                <Button type="primary" htmlType="submit" block>
                    Update Node
                </Button>
            </Form>
        </Card>
    );
};

export default PropertyPanel;
