import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Divider, Table, Button, Space } from 'antd';
import { Node } from 'reactflow';
import { request, FormattedMessage } from '@umijs/max';
import { getVariablesByPackage } from '@/services/RuleVariableController';
import { getPackages } from '@/services/RulePackageController';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

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
    const [packages, setPackages] = useState<API.RulePackage[]>([]);
    const [subPackageVariables, setSubPackageVariables] = useState<API.RuleVariable[]>([]);

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
        if (visible && node?.type === 'RULE_PACKAGE') {
            const fetchPackages = async () => {
                try {
                    const res = await getPackages({});
                    // Filter out current package to avoid recursion if needed, 
                    // though recursion might be valid in some advanced cases, usually it's dangerous.
                    // Let's filter it out for safety.
                    const filtered = (res.data || []).filter((p: any) => p.id !== packageId);
                    setPackages(filtered);
                } catch (e) {
                    // Ignore
                }
            };
            fetchPackages();
        }
    }, [visible, node, packageId]);

    // Watch for package selection to fetch its variables
    const selectedPackageCode = Form.useWatch('packageCode', form);
    useEffect(() => {
        if (selectedPackageCode && packages.length > 0) {
            const pkg = packages.find(p => p.code === selectedPackageCode);
            if (pkg) {
                getVariablesByPackage(pkg.id).then(res => {
                    setSubPackageVariables((res.data as API.RuleVariable[]) || []);
                });
            }
        } else {
            setSubPackageVariables([]);
        }
    }, [selectedPackageCode, packages]);

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
            width={700}
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

                {nodeType === 'RULE_PACKAGE' && (
                    <>
                        <Form.Item
                            name="packageCode"
                            label={<FormattedMessage id="pages.rulePackageNode.package" defaultMessage="Rule Package" />}
                            rules={[{ required: true }]}
                        >
                            <Select placeholder={<FormattedMessage id="pages.rulePackageNode.selectPackage" defaultMessage="Select Rule Package" />}>
                                {packages.map(p => (
                                    <Select.Option key={p.code} value={p.code}>
                                        {p.name} ({p.code})
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Divider orientation="left"><FormattedMessage id="pages.rulePackageNode.inputMapping" defaultMessage="Input Mapping" /></Divider>
                        <p style={{ color: '#999', fontSize: '12px' }}>
                            <FormattedMessage id="pages.rulePackageNode.inputMappingDesc" defaultMessage="Map current variables (Source) to sub-package inputs (Target)." />
                        </p>
                        <Form.List name="inputMapping">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'source']}
                                                rules={[{ required: true, message: 'Missing source' }]}
                                                style={{ width: 200 }}
                                            >
                                                <Select placeholder={<FormattedMessage id="pages.rulePackageNode.currentVar" defaultMessage="Current Variable" />}>
                                                    {variables.map(v => (
                                                        <Select.Option key={v.code} value={v.code}>{v.name}</Select.Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                            <span>→</span>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'target']}
                                                rules={[{ required: true, message: 'Missing target' }]}
                                                style={{ width: 200 }}
                                            >
                                                <Select placeholder={<FormattedMessage id="pages.rulePackageNode.subInput" defaultMessage="Sub-Package Input" />}>
                                                    {subPackageVariables.filter(v => v.category === 'INPUT').map(v => (
                                                        <Select.Option key={v.code} value={v.code}>{v.name}</Select.Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                            <MinusCircleOutlined onClick={() => remove(name)} />
                                        </Space>
                                    ))}
                                    <Form.Item>
                                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                            <FormattedMessage id="pages.rulePackageNode.addInput" defaultMessage="Add Input Mapping" />
                                        </Button>
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>

                        <Divider orientation="left"><FormattedMessage id="pages.rulePackageNode.outputMapping" defaultMessage="Output Mapping" /></Divider>
                        <p style={{ color: '#999', fontSize: '12px' }}>
                            <FormattedMessage id="pages.rulePackageNode.outputMappingDesc" defaultMessage="Map sub-package outputs (Source) to current variables (Target)." />
                        </p>
                        <Form.List name="outputMapping">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'source']}
                                                rules={[{ required: true, message: 'Missing source' }]}
                                                style={{ width: 200 }}
                                            >
                                                <Select placeholder={<FormattedMessage id="pages.rulePackageNode.subOutput" defaultMessage="Sub-Package Output" />}>
                                                    {subPackageVariables.filter(v => v.category === 'OUTPUT').map(v => (
                                                        <Select.Option key={v.code} value={v.code}>{v.name}</Select.Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                            <span>→</span>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'target']}
                                                rules={[{ required: true, message: 'Missing target' }]}
                                                style={{ width: 200 }}
                                            >
                                                <Select placeholder={<FormattedMessage id="pages.rulePackageNode.currentVar" defaultMessage="Current Variable" />}>
                                                    {variables.filter(v => v.category === 'OUTPUT' || v.category === 'INTERNAL').map(v => (
                                                        <Select.Option key={v.code} value={v.code}>{v.name}</Select.Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                            <MinusCircleOutlined onClick={() => remove(name)} />
                                        </Space>
                                    ))}
                                    <Form.Item>
                                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                            <FormattedMessage id="pages.rulePackageNode.addOutput" defaultMessage="Add Output Mapping" />
                                        </Button>
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>
                    </>
                )}

                {(nodeType !== 'CONDITION' && nodeType !== 'ACTION' && nodeType !== 'DECISION' && nodeType !== 'SCORING' && nodeType !== 'SCRIPT' && nodeType !== 'RULE_PACKAGE') && (
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                )}
            </Form>
        </Modal>
    );
};

export default NodeEditModal;

