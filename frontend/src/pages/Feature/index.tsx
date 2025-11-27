import React, { useRef } from 'react';
import { PageContainer, ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Modal, Form, Input, Select, message, Popconfirm, Drawer, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { request, useIntl } from '@umijs/max';
import { getFeatures, createFeature, deleteFeature, updateFeature, executeFeature } from '@/services/FeatureController';
import PermissionGate from '@/components/PermissionGate';

const FeaturePage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const intl = useIntl();

  const handleAdd = async (values: any) => {
    const { configObj, ...rest } = values;
    let config = values.config;
    if (configObj) {
      config = JSON.stringify(configObj);
    }
    if (values.id) {
      await updateFeature(values.id, { ...rest, config });
    } else {
      await createFeature({ ...rest, config });
    }
    message.success(intl.formatMessage({ id: 'common.success' }));
    setIsModalVisible(false);
    actionRef.current?.reload();
  };

  const handleDelete = async (id: number) => {
    await deleteFeature(id);
    message.success(intl.formatMessage({ id: 'common.success' }));
    actionRef.current?.reload();
  };

  const [isTestModalVisible, setIsTestModalVisible] = React.useState(false);
  const [currentFeature, setCurrentFeature] = React.useState<API.Feature | null>(null);
  const [testContext, setTestContext] = React.useState('');
  const [testResult, setTestResult] = React.useState('');
  const [testForm] = Form.useForm();

  const handleTest = async () => {
    if (!currentFeature) return;
    try {
      let context = {};
      // If feature has parameters defined, use form values
      const config = currentFeature.config ? JSON.parse(currentFeature.config) : {};
      if (config.parameters && config.parameters.length > 0) {
        const values = await testForm.validateFields();
        // Convert values based on type if needed, but for now string/json is fine or auto-converted by backend/frontend logic
        context = values;
      } else {
        // Fallback to raw JSON
        context = testContext ? JSON.parse(testContext) : {};
      }

      const res = await executeFeature(currentFeature.id, context);
      setTestResult(JSON.stringify(res.data, null, 2));
    } catch (e) {
      message.error('Execution failed');
    }
  };

  const columns: ProColumns<API.Feature>[] = [
    {
      title: intl.formatMessage({ id: 'pages.feature.name' }),
      dataIndex: 'name',
    },
    {
      title: intl.formatMessage({ id: 'pages.feature.code' }),
      dataIndex: 'code',
    },
    {
      title: intl.formatMessage({ id: 'pages.feature.type' }),
      dataIndex: 'type',
      valueEnum: {
        SQL: { text: 'SQL', status: 'Success' },
        RPC: { text: 'RPC', status: 'Processing' },
        CONSTANT: { text: 'Constant', status: 'Default' },
      },
    },
    {
      title: intl.formatMessage({ id: 'pages.feature.returnType' }),
      dataIndex: 'returnType',
    },
    {
      title: intl.formatMessage({ id: 'pages.feature.description' }),
      dataIndex: 'description',
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({ id: 'common.actions' }),
      valueType: 'option',
      render: (_, record) => [
        <PermissionGate permission="FEATURE_UPDATE">
          <a
            key="edit"
            onClick={() => {
              const configObj = record.config ? JSON.parse(record.config) : {};
              form.setFieldsValue({
                ...record,
                configObj,
              });
              setIsModalVisible(true);
            }}
          >
            {intl.formatMessage({ id: 'common.edit' })}
          </a>
        </PermissionGate>,
        <PermissionGate permission="FEATURE_READ">
          <a
            key="test"
            onClick={() => {
              setCurrentFeature(record);
              setTestContext('{}');
              setTestResult('');
              testForm.resetFields();
              setIsTestModalVisible(true);
            }}
          >
            Test
          </a>
        </PermissionGate>,
        <PermissionGate permission="FEATURE_DELETE">
          <Popconfirm
            key="delete"
            title={intl.formatMessage({ id: 'pages.feature.deleteConfirm' })}
            onConfirm={() => handleDelete(record.id)}
          >
            <a>{intl.formatMessage({ id: 'common.delete' })}</a>
          </Popconfirm>
        </PermissionGate>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.Feature>
        headerTitle={intl.formatMessage({ id: 'menu.features' })}
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 'auto' }}
        toolBarRender={() => [
          <PermissionGate key="create" permission="FEATURE_CREATE">
            <Button
              key="button"
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => {
                form.resetFields();
                setIsModalVisible(true);
              }}
            >
              {intl.formatMessage({ id: 'common.create' })}
            </Button>
          </PermissionGate>,
        ]}
        request={async (params) => {
          const res = await getFeatures(params);
          return {
            data: (res.data as API.Feature[]) || [],
            success: true,
          };
        }}
        columns={columns}
      />
      <Drawer
        title={form.getFieldValue('id') ? intl.formatMessage({ id: 'common.edit' }) : intl.formatMessage({ id: 'common.create' })}
        width={600}
        open={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        extra={
          <Space>
            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()}>
              Submit
            </Button>
          </Space>
        }
      >
        <Form form={form} onFinish={handleAdd} layout="vertical">
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="name" label={intl.formatMessage({ id: 'pages.feature.name' })} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label={intl.formatMessage({ id: 'pages.feature.code' })} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label={intl.formatMessage({ id: 'pages.feature.type' })} rules={[{ required: true }]}>
            <Select onChange={() => {
              // Force re-render to show/hide fields
              const type = form.getFieldValue('type');
            }}>
              <Select.Option value="SQL">SQL</Select.Option>
              <Select.Option value="RPC">RPC</Select.Option>
              <Select.Option value="CONSTANT">Constant</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="returnType" label={intl.formatMessage({ id: 'pages.feature.returnType' })} rules={[{ required: true }]}>
            <Select>
              <Select.Option value="STRING">String</Select.Option>
              <Select.Option value="INTEGER">Integer</Select.Option>
              <Select.Option value="BOOLEAN">Boolean</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}>
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              if (type === 'RPC') {
                return (
                  <>
                    <Form.Item name={['configObj', 'interfaceName']} label="Interface Name" rules={[{ required: true }]}>
                      <Input placeholder="com.example.Service" />
                    </Form.Item>
                    <Form.Item name={['configObj', 'method']} label="Method Name" rules={[{ required: true }]}>
                      <Input placeholder="getUser" />
                    </Form.Item>
                    <Form.Item name={['configObj', 'group']} label="Group">
                      <Input placeholder="SOFA" />
                    </Form.Item>
                    <Form.Item name={['configObj', 'version']} label="Version">
                      <Input placeholder="1.0.0" />
                    </Form.Item>
                    <Form.Item name={['configObj', 'uniqueId']} label="Unique ID">
                      <Input />
                    </Form.Item>
                    <Form.Item label="Argument Types">
                      <Form.List name={['configObj', 'argTypes']}>
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map((field) => (
                              <div key={field.key} style={{ display: 'flex', marginBottom: 8 }}>
                                <Form.Item
                                  {...field}
                                  noStyle
                                  rules={[{ required: true, message: 'Missing type' }]}
                                >
                                  <Input placeholder="java.lang.String" />
                                </Form.Item>
                                <Button type="link" onClick={() => remove(field.name)}>Delete</Button>
                              </div>
                            ))}
                            <Form.Item>
                              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                Add Argument Type
                              </Button>
                            </Form.Item>
                          </>
                        )}
                      </Form.List>
                    </Form.Item>
                    <Form.Item label="Arguments (Values or {placeholders})">
                      <Form.List name={['configObj', 'args']}>
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map((field) => (
                              <div key={field.key} style={{ display: 'flex', marginBottom: 8 }}>
                                <Form.Item
                                  {...field}
                                  noStyle
                                  rules={[{ required: true, message: 'Missing argument' }]}
                                >
                                  <Input placeholder="{userId} or static value" />
                                </Form.Item>
                                <Button type="link" onClick={() => remove(field.name)}>Delete</Button>
                              </div>
                            ))}
                            <Form.Item>
                              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                Add Argument
                              </Button>
                            </Form.Item>
                          </>
                        )}
                      </Form.List>
                    </Form.Item>
                  </>
                );
              } else if (type === 'SQL') {
                return (
                  <Form.Item name={['configObj', 'sql']} label="SQL Query" rules={[{ required: true }]}>
                    <Input.TextArea rows={4} placeholder="SELECT name FROM user WHERE id = {userId}" />
                  </Form.Item>
                );
              } else if (type === 'CONSTANT') {
                return (
                  <Form.Item name={['configObj', 'value']} label="Value" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                );
              }
              // Fallback or default
              return (
                <Form.Item name="config" label={intl.formatMessage({ id: 'pages.feature.config' })}>
                  <Input.TextArea rows={4} />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item label="Input Parameters Configuration">
            <Form.List name={['configObj', 'parameters']}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => (
                    <div key={field.key} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'name']}
                        rules={[{ required: true, message: 'Name required' }]}
                        style={{ flex: 1, marginBottom: 0 }}
                      >
                        <Input placeholder="Param Name (e.g. userId)" />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, 'type']}
                        rules={[{ required: true, message: 'Type required' }]}
                        style={{ width: 100, marginBottom: 0 }}
                      >
                        <Select placeholder="Type">
                          <Select.Option value="STRING">String</Select.Option>
                          <Select.Option value="INTEGER">Integer</Select.Option>
                          <Select.Option value="BOOLEAN">Boolean</Select.Option>
                          <Select.Option value="DATE">Date</Select.Option>
                        </Select>
                      </Form.Item>
                      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                    </div>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Add Input Parameter
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item name="description" label={intl.formatMessage({ id: 'pages.feature.description' })}>
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        title="Test Feature"
        open={isTestModalVisible}
        onCancel={() => setIsTestModalVisible(false)}
        onOk={handleTest}
        okText="Execute"
      >
        <Form layout="vertical" form={testForm}>
          {(() => {
            const config = currentFeature?.config ? JSON.parse(currentFeature.config) : {};
            if (config.parameters && config.parameters.length > 0) {
              return (
                <>
                  {config.parameters.map((param: any) => (
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
              );
            }
            return (
              <Form.Item label="Context (JSON)">
                <Input.TextArea
                  rows={4}
                  value={testContext}
                  onChange={e => setTestContext(e.target.value)}
                  placeholder='{"userId": 1}'
                />
              </Form.Item>
            );
          })()}
          <Form.Item label="Result">
            <Input.TextArea rows={4} value={testResult} readOnly />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default FeaturePage;
