import React, { memo, useEffect, useState } from 'react';
import { NodeProps } from 'reactflow';
import { DeploymentUnitOutlined, PlusOutlined, MinusCircleOutlined, RightOutlined, SwapOutlined, EditOutlined } from '@ant-design/icons';
import { Typography, Space, Select, Button, Divider, Tooltip } from 'antd';
import { useIntl, history } from 'umi';
import { BaseNode } from './BaseNode';
import { CompositionInput } from '../CompositionInput';
import { getPackages } from '@/services/RulePackageController';
import { getVariablesByPackage } from '@/services/RuleVariableController';

const { Text } = Typography;

const RulePackageNode = (props: NodeProps) => {
    const { id, data } = props;
    const { formatMessage } = useIntl();
    const [packages, setPackages] = useState<API.RulePackage[]>([]);
    const [currentVariables, setCurrentVariables] = useState<API.RuleVariable[]>([]);
    const [subPackageVariables, setSubPackageVariables] = useState<API.RuleVariable[]>([]);

    // Fetch available packages and current variables
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch packages
                const pkgRes = await getPackages({});
                // Filter out current package to prevent recursion
                const filteredPackages = (pkgRes.data || []).filter((p: any) => p.id !== data.packageId);
                setPackages(filteredPackages);

                // Fetch current variables
                if (data.packageId) {
                    const varRes = await getVariablesByPackage(data.packageId);
                    setCurrentVariables(varRes.data || []);
                }
            } catch (e) {
                console.error('Failed to fetch data', e);
            }
        };
        fetchData();
    }, [data.packageId]);

    // Fetch sub-package variables when packageCode changes
    useEffect(() => {
        const fetchSubPackageVars = async () => {
            if (data.packageCode && packages.length > 0) {
                const selectedPkg = packages.find(p => p.code === data.packageCode);
                if (selectedPkg) {
                    try {
                        const res = await getVariablesByPackage(selectedPkg.id);
                        setSubPackageVariables(res.data || []);
                    } catch (e) {
                        console.error('Failed to fetch sub-package variables', e);
                    }
                }
            } else {
                setSubPackageVariables([]);
            }
        };
        fetchSubPackageVars();
    }, [data.packageCode, packages]);

    const handleDataChange = (updates: any) => {
        if (data.onChange) {
            data.onChange(id, { ...data, ...updates });
        }
    };

    const handleAddMapping = (type: 'input' | 'output') => {
        const key = type === 'input' ? 'inputMapping' : 'outputMapping';
        const currentMapping = data[key] || [];
        handleDataChange({
            [key]: [...currentMapping, { source: undefined, target: undefined }]
        });
    };

    const handleRemoveMapping = (type: 'input' | 'output', index: number) => {
        const key = type === 'input' ? 'inputMapping' : 'outputMapping';
        const currentMapping = [...(data[key] || [])];
        currentMapping.splice(index, 1);
        handleDataChange({ [key]: currentMapping });
    };

    const handleMappingChange = (type: 'input' | 'output', index: number, field: 'source' | 'target', value: string) => {
        const key = type === 'input' ? 'inputMapping' : 'outputMapping';
        const currentMapping = [...(data[key] || [])];
        const newMapping = { ...currentMapping[index], [field]: value };

        // Auto-save target type for conversion
        if (type === 'input' && field === 'target') {
            const targetVar = subPackageVariables.find(v => v.code === value);
            if (targetVar) {
                newMapping.targetType = targetVar.type;
            }
        } else if (type === 'output' && field === 'target') {
            const targetVar = currentVariables.find(v => v.code === value);
            if (targetVar) {
                newMapping.targetType = targetVar.type;
            }
        }

        currentMapping[index] = newMapping;
        handleDataChange({ [key]: currentMapping });
    };

    return (
        <BaseNode {...props} style={{ minWidth: 350 }}>
            {/* Header Content */}
            <Space size={4} align="center">
                <DeploymentUnitOutlined style={{ color: '#eb2f96' }} />
                <Text strong style={{ fontSize: 12 }}>
                    {formatMessage({ id: 'pages.rulePackageNode.title', defaultMessage: '规则包节点' })}
                </Text>
                {data.packageCode && (
                    <Tooltip title={formatMessage({ id: 'pages.rulePackageNode.editPackage', defaultMessage: 'Edit Rule Package' })}>
                        <EditOutlined
                            style={{ cursor: 'pointer', color: '#1890ff', marginLeft: 4 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                const pkg = packages.find(p => p.code === data.packageCode);
                                if (pkg) {
                                    history.push(`/rule/editor/${pkg.id}`);
                                }
                            }}
                        />
                    </Tooltip>
                )}
            </Space>

            {/* Body Content */}
            <div style={{ marginTop: 8 }} className="nodrag">
                <Select
                    className="nodrag"
                    popupClassName="node-dropdown"
                    dropdownMatchSelectWidth={false}
                    placeholder={formatMessage({ id: 'pages.rulePackageNode.selectPackage', defaultMessage: 'Select Rule Package' })}
                    style={{ width: '100%', marginBottom: 8 }}
                    value={data.packageCode}
                    onChange={(val) => handleDataChange({ packageCode: val, inputMapping: [], outputMapping: [] })}
                    size="small"
                >
                    {packages.map(p => (
                        <Select.Option key={p.code} value={p.code}>{p.name}</Select.Option>
                    ))}
                </Select>

                {data.packageCode && (
                    <>
                        {/* Input Mapping */}
                        <Divider style={{ margin: '8px 0', fontSize: 10, color: '#999' }}>
                            {formatMessage({ id: 'pages.rulePackageNode.inputMapping', defaultMessage: 'Input Mapping' })}
                        </Divider>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 150, overflowY: 'auto', paddingRight: 4 }}>
                            {(data.inputMapping || []).map((mapping: any, index: number) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <div style={{ flex: 1, display: 'flex', gap: 2 }}>
                                        {mapping.isSourceRef === false ? (
                                            <CompositionInput
                                                className="nodrag"
                                                value={mapping.source}
                                                onChange={(e: any) => handleMappingChange('input', index, 'source', e.target.value)}
                                                placeholder="Value/Expr"
                                                size="small"
                                                style={{ width: '100%' }}
                                            />
                                        ) : (
                                            <Select
                                                className="nodrag"
                                                popupClassName="node-dropdown"
                                                dropdownMatchSelectWidth={false}
                                                placeholder="Source"
                                                size="small"
                                                style={{ width: '100%' }}
                                                value={mapping.source}
                                                onChange={(val) => handleMappingChange('input', index, 'source', val)}
                                            >
                                                {currentVariables.map(v => (
                                                    <Select.Option key={v.code} value={v.code}>
                                                        <Space>
                                                            <span>{v.name}</span>
                                                            <Text type="secondary" style={{ fontSize: 10 }}>{v.code}</Text>
                                                        </Space>
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        )}
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<SwapOutlined />}
                                            onClick={() => {
                                                const newMapping = { ...mapping, isSourceRef: !mapping.isSourceRef !== false }; // Default to true, so toggle makes it false
                                                // Reset value if switching? Maybe keep it.
                                                const key = 'inputMapping';
                                                const current = [...(data[key] || [])];
                                                current[index] = newMapping;
                                                handleDataChange({ [key]: current });
                                            }}
                                            title="Toggle Reference/Value"
                                        />
                                    </div>
                                    <RightOutlined style={{ fontSize: 10, color: '#999' }} />
                                    <Select
                                        className="nodrag"
                                        popupClassName="node-dropdown"
                                        dropdownMatchSelectWidth={false}
                                        placeholder="Target"
                                        size="small"
                                        style={{ flex: 1, width: 0 }}
                                        value={mapping.target}
                                        onChange={(val) => handleMappingChange('input', index, 'target', val)}
                                    >
                                        {subPackageVariables.filter(v => v.category === 'INPUT').map(v => (
                                            <Select.Option key={v.code} value={v.code}>
                                                <Space>
                                                    <span>{v.name}</span>
                                                    <Text type="secondary" style={{ fontSize: 10 }}>{v.code}</Text>
                                                </Space>
                                            </Select.Option>
                                        ))}
                                    </Select>
                                    <MinusCircleOutlined
                                        style={{ color: '#ff4d4f', cursor: 'pointer' }}
                                        onClick={() => handleRemoveMapping('input', index)}
                                    />
                                </div>
                            ))}
                            <Button
                                type="dashed"
                                size="small"
                                icon={<PlusOutlined />}
                                onClick={() => handleAddMapping('input')}
                                style={{ fontSize: 10 }}
                            >
                                {formatMessage({ id: 'pages.rulePackageNode.addInput', defaultMessage: 'Add Input' })}
                            </Button>
                        </div>

                        {/* Output Mapping */}
                        <Divider style={{ margin: '8px 0', fontSize: 10, color: '#999' }}>
                            {formatMessage({ id: 'pages.rulePackageNode.outputMapping', defaultMessage: 'Output Mapping' })}
                        </Divider>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 150, overflowY: 'auto', paddingRight: 4 }}>
                            {(data.outputMapping || []).map((mapping: any, index: number) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Select
                                        className="nodrag"
                                        popupClassName="node-dropdown"
                                        dropdownMatchSelectWidth={false}
                                        placeholder="Source"
                                        size="small"
                                        style={{ flex: 1, width: 0 }}
                                        value={mapping.source}
                                        onChange={(val) => handleMappingChange('output', index, 'source', val)}
                                    >
                                        {subPackageVariables.filter(v => v.category === 'OUTPUT').map(v => (
                                            <Select.Option key={v.code} value={v.code}>
                                                <Space>
                                                    <span>{v.name}</span>
                                                    <Text type="secondary" style={{ fontSize: 10 }}>{v.code}</Text>
                                                </Space>
                                            </Select.Option>
                                        ))}
                                    </Select>
                                    <RightOutlined style={{ fontSize: 10, color: '#999' }} />
                                    <div style={{ flex: 1, display: 'flex', gap: 2 }}>
                                        {mapping.isTargetRef === false ? (
                                            <CompositionInput
                                                className="nodrag"
                                                value={mapping.target}
                                                onChange={(e: any) => handleMappingChange('output', index, 'target', e.target.value)}
                                                placeholder="Target Expr"
                                                size="small"
                                                style={{ width: '100%' }}
                                            />
                                        ) : (
                                            <Select
                                                className="nodrag"
                                                popupClassName="node-dropdown"
                                                dropdownMatchSelectWidth={false}
                                                placeholder="Target"
                                                size="small"
                                                style={{ width: '100%' }}
                                                value={mapping.target}
                                                onChange={(val) => handleMappingChange('output', index, 'target', val)}
                                            >
                                                {currentVariables.filter(v => v.category === 'OUTPUT' || v.category === 'INTERNAL').map(v => (
                                                    <Select.Option key={v.code} value={v.code}>
                                                        <Space>
                                                            <span>{v.name}</span>
                                                            <Text type="secondary" style={{ fontSize: 10 }}>{v.code}</Text>
                                                        </Space>
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        )}
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<SwapOutlined />}
                                            onClick={() => {
                                                const newMapping = { ...mapping, isTargetRef: !mapping.isTargetRef !== false };
                                                const key = 'outputMapping';
                                                const current = [...(data[key] || [])];
                                                current[index] = newMapping;
                                                handleDataChange({ [key]: current });
                                            }}
                                            title="Toggle Reference/Expression"
                                        />
                                    </div>
                                    <MinusCircleOutlined
                                        style={{ color: '#ff4d4f', cursor: 'pointer' }}
                                        onClick={() => handleRemoveMapping('output', index)}
                                    />
                                </div>
                            ))}
                            <Button
                                type="dashed"
                                size="small"
                                icon={<PlusOutlined />}
                                onClick={() => handleAddMapping('output')}
                                style={{ fontSize: 10 }}
                            >
                                {formatMessage({ id: 'pages.rulePackageNode.addOutput', defaultMessage: 'Add Output' })}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </BaseNode>
    );
};

export default memo(RulePackageNode);
