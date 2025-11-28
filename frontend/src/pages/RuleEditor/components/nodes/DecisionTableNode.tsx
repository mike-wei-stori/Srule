import React, { memo, useEffect, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Select, Input, Space, Typography, Button } from 'antd';
import { PlusOutlined, DeleteOutlined, DownOutlined } from '@ant-design/icons';
import { BaseNode } from './BaseNode';
import { getVariablesByPackage } from '@/services/RuleVariableController';
import { useIntl } from '@umijs/max';

const { Text } = Typography;

const DecisionTableNode = (props: NodeProps) => {
    const { id, data } = props;
    const [variables, setVariables] = useState<any[]>([]);
    const hasFetched = React.useRef(false);
    const intl = useIntl();

    useEffect(() => {
        if (data.packageId && !hasFetched.current) {
            hasFetched.current = true;
            const fetchVariables = async () => {
                try {
                    const res = await getVariablesByPackage(data.packageId);
                    setVariables(res.data || []);
                } catch (e) {
                    // Ignore
                }
            };
            fetchVariables();
        }
    }, [data.packageId]);

    const handleDataChange = (updates: any) => {
        if (data.onChange) {
            data.onChange(id, { ...data, ...updates });
        }
    };

    const branches = data.branches || [];

    const addBranch = () => {
        const newBranch = {
            id: `branch_${Date.now()}`,
            type: 'CONDITION', // CONDITION or EXPRESSION
            parameter: undefined,
            operator: '==',
            value: '',
            expression: ''
        };
        handleDataChange({ branches: [...branches, newBranch] });
    };

    const removeBranch = (branchId: string) => {
        handleDataChange({ branches: branches.filter((b: any) => b.id !== branchId) });
    };

    const updateBranch = (branchId: string, updates: any) => {
        handleDataChange({
            branches: branches.map((b: any) => b.id === branchId ? { ...b, ...updates } : b)
        });
    };

    return (
        <BaseNode {...props} style={{ minWidth: 400 }} sourceHandles={<></>}>
            <Space size={4} align="center">
                <Text style={{ fontSize: 14 }}>📋</Text>
                <Text strong style={{ fontSize: 12 }}>{intl.formatMessage({ id: 'pages.editor.node.decisionTable', defaultMessage: 'Decision Table Node' })}</Text>
            </Space>

            <Space direction="vertical" size={6} style={{ width: '100%', marginTop: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {branches.map((b: any, index: number) => (
                        <div key={b.id} style={{ position: 'relative', padding: 4, border: '1px dashed #d9d9d9', borderRadius: 4 }}>
                            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                                <Select
                                    className="nodrag"
                                    value={b.type}
                                    onChange={(val) => updateBranch(b.id, { type: val })}
                                    size="small"
                                    style={{ width: 90 }}
                                    options={[
                                        { label: 'Cond', value: 'CONDITION' },
                                        { label: 'Expr', value: 'EXPRESSION' }
                                    ]}
                                />
                                <div style={{ flex: 1 }} />
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    onClick={() => removeBranch(b.id)}
                                    danger
                                />
                            </div>

                            {b.type === 'CONDITION' ? (
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <Select
                                        className="nodrag"
                                        popupClassName="node-dropdown"
                                        value={b.parameter}
                                        onChange={(val) => updateBranch(b.id, { parameter: val })}
                                        size="small"
                                        style={{ width: 120 }}
                                        placeholder="Var"
                                        showSearch
                                    >
                                        {variables.map(v => (
                                            <Select.Option key={v.code} value={v.code}>{v.name}</Select.Option>
                                        ))}
                                    </Select>
                                    <Select
                                        className="nodrag"
                                        value={b.operator}
                                        onChange={(val) => updateBranch(b.id, { operator: val })}
                                        size="small"
                                        style={{ width: 80 }}
                                    >
                                        <Select.Option value="==">==</Select.Option>
                                        <Select.Option value="!=">!=</Select.Option>
                                        <Select.Option value=">">&gt;</Select.Option>
                                        <Select.Option value=">=">&gt;=</Select.Option>
                                        <Select.Option value="<">&lt;</Select.Option>
                                        <Select.Option value="<=">&lt;=</Select.Option>
                                        <Select.Option value="contains">contains</Select.Option>
                                    </Select>
                                    <Input
                                        className="nodrag"
                                        value={b.value}
                                        onChange={(e) => updateBranch(b.id, { value: e.target.value })}
                                        size="small"
                                        placeholder="Value"
                                        style={{ flex: 1 }}
                                    />
                                </div>
                            ) : (
                                <Input.TextArea
                                    className="nodrag"
                                    value={b.expression}
                                    onChange={(e) => updateBranch(b.id, { expression: e.target.value })}
                                    size="small"
                                    placeholder="e.g. age > 18 && score > 60"
                                    autoSize={{ minRows: 1, maxRows: 3 }}
                                />
                            )}

                            {/* Handle for this branch */}
                            <div style={{ position: 'absolute', right: -16, top: '50%', transform: 'translateY(-50%)' }}>
                                <Handle
                                    type="source"
                                    position={Position.Right}
                                    id={b.id}
                                    className="custom-node-handle"
                                    style={{ background: '#722ed1' }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <Button
                    type="dashed"
                    size="small"
                    block
                    icon={<PlusOutlined />}
                    onClick={addBranch}
                >
                    {intl.formatMessage({ id: 'pages.editor.node.decisionTable.addBranch', defaultMessage: 'Add Branch' })}
                </Button>
            </Space>
        </BaseNode>
    );
};

export default memo(DecisionTableNode);
