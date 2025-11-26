import React, { useState, useEffect } from 'react';
import { Card, Form, Input, InputNumber, DatePicker, Switch, Button, Descriptions, Tag, Divider, message } from 'antd';
import { request } from '@umijs/max';
import { getVariablesByPackage } from '@/services/RuleVariableController';
import { executeRule } from '@/services/RuleExecutionController';
import dayjs from 'dayjs';

interface TestPanelProps {
    packageCode: string;
    packageId: number;
}

const TestPanel: React.FC<TestPanelProps> = ({ packageCode, packageId }) => {
    const [form] = Form.useForm();
    const [variables, setVariables] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        const fetchVariables = async () => {
            try {
                const res = await getVariablesByPackage(packageId);
                setVariables(res.data || []);
            } catch (e) {
                // Ignore
            }
        };
        fetchVariables();
    }, [packageId]);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            // Format values based on type
            const inputs: any = {};
            variables.filter(v => v.category === 'INPUT').forEach(v => {
                const val = values[v.code];
                if (val !== undefined) {
                    if (v.type === 'DATE' && val) {
                        inputs[v.code] = val.format('YYYY-MM-DD');
                    } else {
                        inputs[v.code] = val;
                    }
                }
            });

            const res = await executeRule({
                packageId,
                packageCode,
                inputs,
            });
            setResult(res.data);
            message.success('Execution successful');
        } catch (e) {
            // Error handled by interceptor
        } finally {
            setLoading(false);
        }
    };

    const renderInput = (variable: any) => {
        switch (variable.type) {
            case 'INTEGER':
            case 'DOUBLE':
                return <InputNumber style={{ width: '100%' }} />;
            case 'BOOLEAN':
                return <Switch />;
            case 'DATE':
                return <DatePicker style={{ width: '100%' }} />;
            default:
                return <Input />;
        }
    };

    const inputVariables = variables.filter(v => v.category === 'INPUT');
    const outputVariables = variables.filter(v => v.category === 'OUTPUT');

    return (
        <div style={{ display: 'flex', gap: 16 }}>
            <Card title="Test Inputs" style={{ flex: 1 }}>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    {inputVariables.map(v => (
                        <Form.Item
                            key={v.code}
                            name={v.code}
                            label={`${v.name} (${v.code})`}
                            valuePropName={v.type === 'BOOLEAN' ? 'checked' : 'value'}
                        >
                            {renderInput(v)}
                        </Form.Item>
                    ))}
                    {inputVariables.length === 0 && <p>No INPUT variables defined.</p>}
                    <Button type="primary" htmlType="submit" loading={loading} block>
                        Run Test
                    </Button>
                </Form>
            </Card>

            <Card title="Execution Results" style={{ flex: 1 }}>
                {result ? (
                    <>
                        <Divider orientation="left">Output Variables</Divider>
                        <Descriptions column={1} bordered>
                            {outputVariables.map(v => (
                                <Descriptions.Item key={v.code} label={v.name}>
                                    {result[v.code] !== undefined ? String(result[v.code]) : <Tag color="default">Not Set</Tag>}
                                </Descriptions.Item>
                            ))}
                        </Descriptions>

                        <Divider orientation="left">Full Context</Divider>
                        <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, overflow: 'auto' }}>
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', color: '#999', marginTop: 32 }}>
                        Run a test to see results
                    </div>
                )}
            </Card>
        </div>
    );
};

export default TestPanel;
