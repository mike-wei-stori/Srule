import React, { useRef } from 'react';
import { PageContainer, ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { request, useIntl } from '@umijs/max';
import { getFeatures, createFeature, deleteFeature } from '@/services/FeatureController';

const FeaturePage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const intl = useIntl();

  const handleAdd = async (values: any) => {
    await createFeature(values);
    message.success(intl.formatMessage({ id: 'common.success' }));
    setIsModalVisible(false);
    actionRef.current?.reload();
  };

  const handleDelete = async (id: number) => {
    await deleteFeature(id);
    message.success(intl.formatMessage({ id: 'common.success' }));
    actionRef.current?.reload();
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
      dataIndex: 'type', // Note: API.Feature might not have 'type' or 'config', check definition
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
        <Popconfirm
          key="delete"
          title={intl.formatMessage({ id: 'pages.feature.deleteConfirm' })}
          onConfirm={() => handleDelete(record.id)}
        >
          <a>{intl.formatMessage({ id: 'common.delete' })}</a>
        </Popconfirm>,
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
          <Button key="button" icon={<PlusOutlined />} type="primary" onClick={() => setIsModalVisible(true)}>
            {intl.formatMessage({ id: 'common.create' })}
          </Button>,
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
      <Modal
        title={intl.formatMessage({ id: 'common.create' })}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleAdd} layout="vertical">
          <Form.Item name="name" label={intl.formatMessage({ id: 'pages.feature.name' })} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label={intl.formatMessage({ id: 'pages.feature.code' })} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label={intl.formatMessage({ id: 'pages.feature.type' })} rules={[{ required: true }]}>
            <Select>
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
          <Form.Item name="config" label={intl.formatMessage({ id: 'pages.feature.config' })}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="description" label={intl.formatMessage({ id: 'pages.feature.description' })}>
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default FeaturePage;
