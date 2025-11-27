import React, { useEffect, useState } from 'react';
import { PageContainer, ProDescriptions } from '@ant-design/pro-components';
import { Card, Spin, message, Typography, Tag, List, Button, Form, Input, Modal } from 'antd';
import { useParams, useIntl } from '@umijs/max';
import { getFeature, executeFeature } from '@/services/FeatureController';

const FeatureDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [feature, setFeature] = useState<API.Feature | null>(null);
    const [loading, setLoading] = useState(true);
    const intl = useIntl();

    // Test state
    const [isTestModalVisible, setIsTestModalVisible] = useState(false);
    const [testResult, setTestResult] = useState('');
    const [testContext, setTestContext] = useState('');
    const [testForm] = Form.useForm();

    useEffect(() => {
        if (id) {
            fetchFeature(Number(id));
        }
    }, [id]);

    const fetchFeature = async (featureId: number) => {
        setLoading(true);
        try {
            const res = await getFeature(featureId);
            if (res.data) {
                setFeature(res.data);
            }
        } catch (error) {
            message.error('Failed to fetch feature details');
        } finally {
            setLoading(false);
        }
    };

    const handleTest = async () => {
        if (!feature) return;
        try {
            let context = {};
            const config = feature.config ? JSON.parse(feature.config) : {};
            if (config.parameters && config.parameters.length > 0) {
                const values = await testForm.validateFields();
                context = values;
            } else {
                context = testContext ? JSON.parse(testContext) : {};
            }

            const res = await executeFeature(feature.id, context);
            setTestResult(JSON.stringify(res.data, null, 2));
        } catch (e) {
            message.error('Execution failed');
        }
    };

    if (loading) {
        return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;
    }

    if (!feature) {
        return <div>Feature not found</div>;
    }

    let configObj: any = {};
    try {
        configObj = feature.config ? JSON.parse(feature.config) : {};
    } catch (e) {
        // ignore
    }

    return (
        <PageContainer
            header={{
                title: feature.name,
                subTitle: feature.code,
                tags: <Tag color="blue">{feature.type}</Tag>,
                extra: [
                    <Button key="test" type="primary" onClick={() => {
                        setTestContext('{}');
                        setTestResult('');
                        testForm.resetFields();
                        setIsTestModalVisible(true);
                    }}>
                        Test Feature
                    </Button>
                ]
            }}
        >
            <Card title="Basic Information" bordered={false} style={{ marginBottom: 24 }}>
                <ProDescriptions column={2}>
                    <ProDescriptions.Item label="ID">{feature.id}</ProDescriptions.Item>
                    <ProDescriptions.Item label="Return Type">{feature.returnType}</ProDescriptions.Item>
                    <ProDescriptions.Item label="Description" span={2}>{feature.description}</ProDescriptions.Item>
                    <ProDescriptions.Item label="Created At">{feature.createTime}</ProDescriptions.Item>
                    <ProDescriptions.Item label="Updated At">{feature.updateTime}</ProDescriptions.Item>
                </ProDescriptions>
            </Card>

            <Card title="Configuration" bordered={false} style={{ marginBottom: 24 }}>
                {configObj.parameters && configObj.parameters.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                        <Typography.Title level={5}>Input Parameters</Typography.Title>
                        <List
                            bordered
                            dataSource={configObj.parameters}
                            renderItem={(item: any) => (
                                <List.Item>
                                    <Typography.Text strong>{item.name}</Typography.Text>
                                    <Tag style={{ marginLeft: 16 }}>{item.type}</Tag>
                                </List.Item>
                            )}
                        />
                    </div>
                )}

                {feature.type === 'SQL' && (
                    <div>
                        <Typography.Title level={5}>SQL Query</Typography.Title>
                        <Typography.Paragraph code>
                            {configObj.sql}
                        </Typography.Paragraph>
                    </div>
                )}

                {feature.type === 'RPC' && (
                    <div>
                        <Typography.Title level={5}>RPC Details</Typography.Title>
                        <ProDescriptions column={1}>
                            <ProDescriptions.Item label="Interface">{configObj.interfaceName}</ProDescriptions.Item>
                            <ProDescriptions.Item label="Method">{configObj.method}</ProDescriptions.Item>
                            <ProDescriptions.Item label="Group">{configObj.group}</ProDescriptions.Item>
                            <ProDescriptions.Item label="Version">{configObj.version}</ProDescriptions.Item>
                        </ProDescriptions>
                    </div>
                )}
                {feature.type === 'CONSTANT' && (
                    <div>
                        <Typography.Title level={5}>Constant Value</Typography.Title>
                        <Typography.Paragraph code>
                            {configObj.value}
                        </Typography.Paragraph>
                    </div>
                )}
            </Card>

            <Modal
                title="Test Feature"
                open={isTestModalVisible}
                onCancel={() => setIsTestModalVisible(false)}
                onOk={handleTest}
                okText="Execute"
            >
                <Form layout="vertical" form={testForm}>
                    {configObj.parameters && configObj.parameters.length > 0 ? (
                        <>
                            {configObj.parameters.map((param: any) => (
                                <Form.Item
                                    key={param.name}
                                    name={param.name}
                                    label={`${param.name} (${param.type})`}
                                    rules={[{ required: true }]}
                                >
                                    <Input />
                                </Form.Item>
                            ))}
                        </>
                    ) : (
                        <Form.Item label="Context (JSON)">
                            <Input.TextArea
                                rows={4}
                                value={testContext}
                                onChange={e => setTestContext(e.target.value)}
                                placeholder='{"userId": 1}'
                            />
                        </Form.Item>
                    )}
                    <Form.Item label="Result">
                        <Input.TextArea rows={4} value={testResult} readOnly />
                    </Form.Item>
                </Form>
            </Modal>
        </PageContainer>
    );
};

export default FeatureDetail;
