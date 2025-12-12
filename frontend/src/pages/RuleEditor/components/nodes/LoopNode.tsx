import React, { memo, useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Select, Space, Typography, Tag, InputNumber, Input } from 'antd';
import { SyncOutlined, DownOutlined } from '@ant-design/icons';
import { BaseNode } from './BaseNode';
import { CompositionInput } from '../CompositionInput';
import { getVariablesByPackage } from '@/services/RuleVariableController';
import { useIntl } from '@umijs/max';

const { Text } = Typography;

const LoopNode = (props: NodeProps) => {
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
                    setVariables((res.data as any[]) || []);
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

    const loopType = data.loopType || 'COUNT';
    const selectedCollectionVar = variables.find(v => v.code === data.collectionVariable);

    const loopHandles = (
        <>
            <Handle
                type="source"
                position={Position.Right}
                id="loopBody"
                style={{ top: '30%', background: '#13c2c2' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="afterLoop"
                style={{ top: '70%', background: '#8c8c8c' }}
            />
        </>
    );

    return (
        <BaseNode {...props} style={{ minWidth: 280 }} sourceHandles={loopHandles}>
            <Space size={4}>
                <SyncOutlined style={{ color: '#13c2c2', fontSize: 14 }} />
                <Text type="secondary" style={{ fontSize: 11 }}>LOOP</Text>
            </Space>

            <Space direction="vertical" size={6} style={{ width: '100%', marginTop: 8 }} className="nodrag">
                {/* 循环类型选择 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 10, width: 50 }}>{intl.formatMessage({ id: 'pages.loopNode.type', defaultMessage: '类型' })}:</Text>
                    <Select
                        popupClassName="node-dropdown"
                        value={loopType}
                        onChange={(value) => handleDataChange({ loopType: value })}
                        size="small"
                        style={{ flex: 1 }}
                        options={[
                            { label: intl.formatMessage({ id: 'pages.loopNode.count', defaultMessage: '固定次数' }), value: 'COUNT' },
                            { label: intl.formatMessage({ id: 'pages.loopNode.collection', defaultMessage: '遍历集合' }), value: 'COLLECTION' },
                            { label: intl.formatMessage({ id: 'pages.loopNode.while', defaultMessage: '条件循环' }), value: 'WHILE' }
                        ]}
                    />
                </div>

                {/* COUNT 模式 - 固定次数 */}
                {loopType === 'COUNT' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 10, width: 50 }}>{intl.formatMessage({ id: 'pages.loopNode.times', defaultMessage: '次数' })}:</Text>
                        <InputNumber
                            value={data.maxIterations || 10}
                            onChange={(value) => handleDataChange({ maxIterations: value })}
                            size="small"
                            min={1}
                            max={1000}
                            style={{ flex: 1 }}
                        />
                    </div>
                )}

                {/* COLLECTION 模式 - 遍历集合 */}
                {loopType === 'COLLECTION' && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Text style={{ fontSize: 10, width: 50 }}>{intl.formatMessage({ id: 'pages.loopNode.list', defaultMessage: '集合' })}:</Text>
                            <Select
                                popupClassName="node-dropdown"
                                dropdownMatchSelectWidth={false}
                                value={data.collectionVariable}
                                onChange={(value) => handleDataChange({ collectionVariable: value })}
                                placeholder={intl.formatMessage({ id: 'pages.loopNode.selectList', defaultMessage: '选择集合变量' })}
                                size="small"
                                style={{ flex: 1 }}
                                suffixIcon={<DownOutlined style={{ fontSize: 10 }} />}
                            >
                                {variables.filter(v => v.type?.includes('List') || v.type?.includes('Array') || v.type === 'LIST').map(v => (
                                    <Select.Option key={v.code} value={v.code}>
                                        {v.name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Text style={{ fontSize: 10, width: 50 }}>{intl.formatMessage({ id: 'pages.loopNode.item', defaultMessage: '当前项' })}:</Text>
                            <Select
                                popupClassName="node-dropdown"
                                dropdownMatchSelectWidth={false}
                                value={data.itemVariable}
                                onChange={(value) => handleDataChange({ itemVariable: value })}
                                placeholder={intl.formatMessage({ id: 'pages.loopNode.selectItem', defaultMessage: '存储当前项' })}
                                size="small"
                                style={{ flex: 1 }}
                                allowClear
                            >
                                {variables.filter(v => v.category === 'INTERNAL' || v.category === 'OUTPUT').map(v => (
                                    <Select.Option key={v.code} value={v.code}>
                                        {v.name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>
                        {selectedCollectionVar && (
                            <Tag color="cyan" style={{ fontSize: 10 }}>{selectedCollectionVar.type}</Tag>
                        )}
                    </>
                )}

                {/* WHILE 模式 - 条件循环 */}
                {loopType === 'WHILE' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 10, width: 50 }}>{intl.formatMessage({ id: 'pages.loopNode.condition', defaultMessage: '条件' })}:</Text>
                        <CompositionInput
                            value={data.whileCondition}
                            onChange={(e: any) => handleDataChange({ whileCondition: e.target.value })}
                            placeholder="e.g. count < 10"
                            size="small"
                            style={{ flex: 1 }}
                        />
                    </div>
                )}

                {/* 循环计数器变量（可选） */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 10, width: 50 }}>{intl.formatMessage({ id: 'pages.loopNode.index', defaultMessage: '索引' })}:</Text>
                    <Select
                        popupClassName="node-dropdown"
                        dropdownMatchSelectWidth={false}
                        value={data.loopVariable}
                        onChange={(value) => handleDataChange({ loopVariable: value })}
                        placeholder={intl.formatMessage({ id: 'pages.loopNode.selectIndex', defaultMessage: '存储索引(可选)' })}
                        size="small"
                        style={{ flex: 1 }}
                        allowClear
                    >
                        {variables.filter(v => (v.category === 'INTERNAL' || v.category === 'OUTPUT') && v.type === 'INTEGER').map(v => (
                            <Select.Option key={v.code} value={v.code}>
                                {v.name}
                            </Select.Option>
                        ))}
                    </Select>
                </div>

                {/* Handle 标签 */}
                <div style={{ position: 'absolute', right: -10, top: '30%', fontSize: 10, color: '#13c2c2', transform: 'translate(100%, -50%)' }}>Body</div>
                <div style={{ position: 'absolute', right: -10, top: '70%', fontSize: 10, color: '#8c8c8c', transform: 'translate(100%, -50%)' }}>Exit</div>
            </Space>
        </BaseNode>
    );
};

export default memo(LoopNode);
