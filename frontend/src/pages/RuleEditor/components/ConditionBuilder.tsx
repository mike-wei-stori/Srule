import React, { useState, useEffect } from 'react';
import { Modal, Select, Input, InputNumber, Checkbox, Space, Typography, Divider, Tag } from 'antd';
import type { Condition, ConditionType, ComparisonOperator, StringOperator, DateOperator, ExistenceOperator } from '../types/conditions';
import {
    COMPARISON_OPERATORS,
    STRING_OPERATORS,
    DATE_OPERATORS,
    EXISTENCE_OPERATORS,
    formatCondition,
    getConditionTypeLabel
} from '../types/conditions';

const { Text } = Typography;
const { Option } = Select;

interface ConditionBuilderProps {
    visible: boolean;
    condition?: Condition;
    variables: any[];
    onOk: (condition: Condition) => void;
    onCancel: () => void;
}

const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
    visible,
    condition,
    variables,
    onOk,
    onCancel
}) => {
    const [conditionType, setConditionType] = useState<ConditionType>('COMPARISON');
    const [variable, setVariable] = useState<string>('');
    const [operator, setOperator] = useState<any>('==');
    const [value, setValue] = useState<any>('');
    const [min, setMin] = useState<number>(0);
    const [max, setMax] = useState<number>(100);
    const [includeMin, setIncludeMin] = useState<boolean>(true);
    const [includeMax, setIncludeMax] = useState<boolean>(true);
    const [listValues, setListValues] = useState<string[]>([]);
    const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Initialize from existing condition
    useEffect(() => {
        if (condition) {
            setConditionType(condition.type);

            switch (condition.type) {
                case 'COMPARISON':
                    setVariable(condition.variable);
                    setOperator(condition.operator);
                    setValue(condition.value);
                    break;
                case 'RANGE':
                    setVariable(condition.variable);
                    setMin(condition.min);
                    setMax(condition.max);
                    setIncludeMin(condition.includeMin);
                    setIncludeMax(condition.includeMax);
                    break;
                case 'IN_LIST':
                    setVariable(condition.variable);
                    setListValues(condition.values);
                    break;
                case 'STRING':
                    setVariable(condition.variable);
                    setOperator(condition.operator);
                    setValue(condition.value || '');
                    setCaseSensitive(condition.caseSensitive || false);
                    break;
                case 'DATE':
                    setVariable(condition.variable);
                    setOperator(condition.operator);
                    setValue(condition.value || '');
                    setStartDate(condition.startDate || '');
                    setEndDate(condition.endDate || '');
                    break;
                case 'EXISTENCE':
                    setVariable(condition.variable);
                    setOperator(condition.operator);
                    break;
            }
        }
    }, [condition]);

    const buildCondition = (): Condition => {
        switch (conditionType) {
            case 'COMPARISON':
                return {
                    type: 'COMPARISON',
                    variable,
                    operator: operator as ComparisonOperator,
                    value
                };
            case 'RANGE':
                return {
                    type: 'RANGE',
                    variable,
                    min,
                    max,
                    includeMin,
                    includeMax
                };
            case 'IN_LIST':
                return {
                    type: 'IN_LIST',
                    variable,
                    values: listValues
                };
            case 'STRING':
                return {
                    type: 'STRING',
                    variable,
                    operator: operator as StringOperator,
                    value,
                    caseSensitive
                };
            case 'DATE':
                return {
                    type: 'DATE',
                    variable,
                    operator: operator as DateOperator,
                    value,
                    startDate,
                    endDate
                };
            case 'EXISTENCE':
                return {
                    type: 'EXISTENCE',
                    variable,
                    operator: operator as ExistenceOperator
                };
            default:
                return {
                    type: 'COMPARISON',
                    variable: '',
                    operator: '==',
                    value: ''
                };
        }
    };

    const handleOk = () => {
        const newCondition = buildCondition();
        onOk(newCondition);
    };

    const renderConditionForm = () => {
        switch (conditionType) {
            case 'COMPARISON':
                return (
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                            <Text>变量:</Text>
                            <Select
                                value={variable}
                                onChange={setVariable}
                                style={{ width: '100%', marginTop: 8 }}
                                placeholder="选择变量"
                            >
                                {variables.map(v => (
                                    <Option key={v.code} value={v.code}>
                                        {v.name} <Tag>{v.type}</Tag>
                                    </Option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <Text>操作符:</Text>
                            <Select
                                value={operator}
                                onChange={setOperator}
                                style={{ width: '100%', marginTop: 8 }}
                            >
                                {COMPARISON_OPERATORS.map(op => (
                                    <Option key={op.value} value={op.value}>
                                        {op.icon} {op.label}
                                    </Option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <Text>值:</Text>
                            <Input
                                value={value}
                                onChange={e => setValue(e.target.value)}
                                style={{ marginTop: 8 }}
                                placeholder="输入值"
                            />
                        </div>
                    </Space>
                );

            case 'RANGE':
                return (
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                            <Text>变量:</Text>
                            <Select
                                value={variable}
                                onChange={setVariable}
                                style={{ width: '100%', marginTop: 8 }}
                                placeholder="选择变量"
                            >
                                {variables.filter(v => v.type === 'INTEGER' || v.type === 'DOUBLE').map(v => (
                                    <Option key={v.code} value={v.code}>
                                        {v.name} <Tag>{v.type}</Tag>
                                    </Option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <Text>最小值:</Text>
                            <Space style={{ marginTop: 8 }}>
                                <Checkbox checked={includeMin} onChange={e => setIncludeMin(e.target.checked)}>
                                    包含
                                </Checkbox>
                                <InputNumber value={min} onChange={val => setMin(val || 0)} />
                            </Space>
                        </div>
                        <div>
                            <Text>最大值:</Text>
                            <Space style={{ marginTop: 8 }}>
                                <Checkbox checked={includeMax} onChange={e => setIncludeMax(e.target.checked)}>
                                    包含
                                </Checkbox>
                                <InputNumber value={max} onChange={val => setMax(val || 100)} />
                            </Space>
                        </div>
                    </Space>
                );

            case 'IN_LIST':
                return (
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                            <Text>变量:</Text>
                            <Select
                                value={variable}
                                onChange={setVariable}
                                style={{ width: '100%', marginTop: 8 }}
                                placeholder="选择变量"
                            >
                                {variables.map(v => (
                                    <Option key={v.code} value={v.code}>
                                        {v.name} <Tag>{v.type}</Tag>
                                    </Option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <Text>值列表 (逗号分隔):</Text>
                            <Input
                                value={listValues.join(', ')}
                                onChange={e => setListValues(e.target.value.split(',').map(s => s.trim()))}
                                style={{ marginTop: 8 }}
                                placeholder="例如: ACTIVE, PENDING, APPROVED"
                            />
                        </div>
                    </Space>
                );

            case 'STRING':
                return (
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                            <Text>变量:</Text>
                            <Select
                                value={variable}
                                onChange={setVariable}
                                style={{ width: '100%', marginTop: 8 }}
                                placeholder="选择变量"
                            >
                                {variables.filter(v => v.type === 'STRING').map(v => (
                                    <Option key={v.code} value={v.code}>
                                        {v.name} <Tag>{v.type}</Tag>
                                    </Option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <Text>操作符:</Text>
                            <Select
                                value={operator}
                                onChange={setOperator}
                                style={{ width: '100%', marginTop: 8 }}
                            >
                                {STRING_OPERATORS.map(op => (
                                    <Option key={op.value} value={op.value}>
                                        {op.icon} {op.label}
                                    </Option>
                                ))}
                            </Select>
                        </div>
                        {!['isEmpty', 'isNotEmpty'].includes(operator) && (
                            <div>
                                <Text>值:</Text>
                                <Input
                                    value={value}
                                    onChange={e => setValue(e.target.value)}
                                    style={{ marginTop: 8 }}
                                    placeholder="输入值"
                                />
                            </div>
                        )}
                        <Checkbox checked={caseSensitive} onChange={e => setCaseSensitive(e.target.checked)}>
                            区分大小写
                        </Checkbox>
                    </Space>
                );

            case 'DATE':
                return (
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                            <Text>变量:</Text>
                            <Select
                                value={variable}
                                onChange={setVariable}
                                style={{ width: '100%', marginTop: 8 }}
                                placeholder="选择变量"
                            >
                                {variables.filter(v => v.type === 'DATE').map(v => (
                                    <Option key={v.code} value={v.code}>
                                        {v.name} <Tag>{v.type}</Tag>
                                    </Option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <Text>操作符:</Text>
                            <Select
                                value={operator}
                                onChange={setOperator}
                                style={{ width: '100%', marginTop: 8 }}
                            >
                                {DATE_OPERATORS.map(op => (
                                    <Option key={op.value} value={op.value}>
                                        {op.label}
                                    </Option>
                                ))}
                            </Select>
                        </div>
                        {operator === 'between' ? (
                            <>
                                <div>
                                    <Text>开始日期:</Text>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        style={{ marginTop: 8 }}
                                    />
                                </div>
                                <div>
                                    <Text>结束日期:</Text>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        style={{ marginTop: 8 }}
                                    />
                                </div>
                            </>
                        ) : !['today', 'thisWeek', 'thisMonth'].includes(operator) && (
                            <div>
                                <Text>值:</Text>
                                <Input
                                    type={operator === 'daysAgo' ? 'number' : 'date'}
                                    value={value}
                                    onChange={e => setValue(e.target.value)}
                                    style={{ marginTop: 8 }}
                                    placeholder={operator === 'daysAgo' ? '天数' : '日期'}
                                />
                            </div>
                        )}
                    </Space>
                );

            case 'EXISTENCE':
                return (
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                            <Text>变量:</Text>
                            <Select
                                value={variable}
                                onChange={setVariable}
                                style={{ width: '100%', marginTop: 8 }}
                                placeholder="选择变量"
                            >
                                {variables.map(v => (
                                    <Option key={v.code} value={v.code}>
                                        {v.name} <Tag>{v.type}</Tag>
                                    </Option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <Text>操作符:</Text>
                            <Select
                                value={operator}
                                onChange={setOperator}
                                style={{ width: '100%', marginTop: 8 }}
                            >
                                {EXISTENCE_OPERATORS.map(op => (
                                    <Option key={op.value} value={op.value}>
                                        {op.label}
                                    </Option>
                                ))}
                            </Select>
                        </div>
                    </Space>
                );

            default:
                return null;
        }
    };

    const previewCondition = () => {
        try {
            const cond = buildCondition();
            return formatCondition(cond);
        } catch {
            return '请完成条件配置';
        }
    };

    return (
        <Modal
            title="条件构建器"
            open={visible}
            onOk={handleOk}
            onCancel={onCancel}
            width={600}
            okText="应用"
            cancelText="取消"
        >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                    <Text strong>条件类型:</Text>
                    <Select
                        value={conditionType}
                        onChange={setConditionType}
                        style={{ width: '100%', marginTop: 8 }}
                    >
                        <Option value="COMPARISON">比较条件</Option>
                        <Option value="RANGE">范围条件</Option>
                        <Option value="IN_LIST">列表条件</Option>
                        <Option value="STRING">字符串条件</Option>
                        <Option value="DATE">日期条件</Option>
                        <Option value="EXISTENCE">存在性条件</Option>
                    </Select>
                </div>

                <Divider />

                {renderConditionForm()}

                <Divider />

                <div style={{
                    padding: 12,
                    background: '#f5f5f5',
                    borderRadius: 4,
                    border: '1px solid #d9d9d9'
                }}>
                    <Text type="secondary">预览:</Text>
                    <div style={{ marginTop: 8, fontSize: 14, fontFamily: 'monospace' }}>
                        {previewCondition()}
                    </div>
                </div>
            </Space>
        </Modal>
    );
};

export default ConditionBuilder;
