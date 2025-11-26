import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ActionType, ProColumns, ModalForm, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { Button, message, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getSysConfigs, saveSysConfig, deleteSysConfig } from '@/services/SysConfigController';
import { useIntl } from '@umijs/max';

const SysConfigPage: React.FC = () => {
    const actionRef = useRef<ActionType>();
    const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
    const [currentRow, setCurrentRow] = useState<API.SysConfig | undefined>(undefined);
    const intl = useIntl();

    const handleSave = async (values: API.SysConfig) => {
        try {
            await saveSysConfig(values);
            message.success(intl.formatMessage({ id: 'common.success', defaultMessage: 'Operation successful' }));
            setCreateModalVisible(false);
            setCurrentRow(undefined);
            actionRef.current?.reload();
            return true;
        } catch (error) {
            return false;
        }
    };

    const handleDelete = async (key: string) => {
        try {
            await deleteSysConfig(key);
            message.success(intl.formatMessage({ id: 'common.success', defaultMessage: 'Operation successful' }));
            actionRef.current?.reload();
        } catch (error) {
            // Error handled by interceptor
        }
    };

    const columns: ProColumns<API.SysConfig>[] = [
        {
            title: intl.formatMessage({ id: 'sysConfig.key', defaultMessage: 'Config Key' }),
            dataIndex: 'configKey',
            copyable: true,
            width: 200,
        },
        {
            title: intl.formatMessage({ id: 'sysConfig.value', defaultMessage: 'Config Value' }),
            dataIndex: 'configValue',
            ellipsis: true,
        },
        {
            title: intl.formatMessage({ id: 'sysConfig.description', defaultMessage: 'Description' }),
            dataIndex: 'description',
            ellipsis: true,
        },
        {
            title: intl.formatMessage({ id: 'sysConfig.updatedAt', defaultMessage: 'Updated At' }),
            dataIndex: 'updatedAt',
            valueType: 'dateTime',
            width: 180,
            search: false,
        },
        {
            title: intl.formatMessage({ id: 'common.option', defaultMessage: 'Options' }),
            valueType: 'option',
            width: 150,
            render: (_, record) => [
                <a
                    key="edit"
                    onClick={() => {
                        setCurrentRow(record);
                        setCreateModalVisible(true);
                    }}
                >
                    {intl.formatMessage({ id: 'common.edit', defaultMessage: 'Edit' })}
                </a>,
                <Popconfirm
                    key="delete"
                    title={intl.formatMessage({ id: 'common.deleteConfirm', defaultMessage: 'Are you sure to delete?' })}
                    onConfirm={() => handleDelete(record.configKey)}
                >
                    <a style={{ color: 'red' }}>
                        {intl.formatMessage({ id: 'common.delete', defaultMessage: 'Delete' })}
                    </a>
                </Popconfirm>,
            ],
        },
    ];

    return (
        <PageContainer>
            <ProTable<API.SysConfig>
                headerTitle={intl.formatMessage({ id: 'menu.sysConfig', defaultMessage: 'System Config' })}
                actionRef={actionRef}
                rowKey="id"
                search={{
                    labelWidth: 120,
                }}
                toolBarRender={() => [
                    <Button
                        type="primary"
                        key="primary"
                        onClick={() => {
                            setCurrentRow(undefined);
                            setCreateModalVisible(true);
                        }}
                    >
                        <PlusOutlined /> {intl.formatMessage({ id: 'common.new', defaultMessage: 'New' })}
                    </Button>,
                ]}
                request={async () => {
                    const result = await getSysConfigs();
                    return {
                        data: result.data || [],
                        success: true,
                    };
                }}
                columns={columns}
            />
            
            <ModalForm
                title={currentRow 
                    ? intl.formatMessage({ id: 'sysConfig.edit', defaultMessage: 'Edit Config' }) 
                    : intl.formatMessage({ id: 'sysConfig.new', defaultMessage: 'New Config' })}
                width="500px"
                visible={createModalVisible}
                onVisibleChange={setCreateModalVisible}
                onFinish={handleSave}
                initialValues={currentRow}
                modalProps={{
                    destroyOnClose: true,
                }}
            >
                <ProFormText
                    name="configKey"
                    label={intl.formatMessage({ id: 'sysConfig.key', defaultMessage: 'Config Key' })}
                    rules={[{ required: true, message: intl.formatMessage({ id: 'common.required', defaultMessage: 'This field is required' }) }]}
                    disabled={!!currentRow}
                />
                <ProFormTextArea
                    name="configValue"
                    label={intl.formatMessage({ id: 'sysConfig.value', defaultMessage: 'Config Value' })}
                    fieldProps={{ rows: 4 }}
                />
                <ProFormText
                    name="description"
                    label={intl.formatMessage({ id: 'sysConfig.description', defaultMessage: 'Description' })}
                />
            </ModalForm>
        </PageContainer>
    );
};

export default SysConfigPage;

