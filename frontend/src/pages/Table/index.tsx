import services from '@/services/demo';
import {
  ActionType,
  FooterToolbar,
  PageContainer,
  ProDescriptions,
  ProDescriptionsItemProps,
  ProTable,
  ProColumns,
} from '@ant-design/pro-components';
import { Button, Divider, Drawer, message } from 'antd';
import React, { useRef, useState } from 'react';
import { useIntl } from 'umi';
import CreateForm from './components/CreateForm';
import UpdateForm, { FormValueType } from './components/UpdateForm';

const { addUser, queryUserList, deleteUser, modifyUser } =
  services.UserController;

const TableList: React.FC<unknown> = () => {
  const { formatMessage } = useIntl();

  /**
   * 添加节点
   * @param fields
   */
  const handleAdd = async (fields: API.UserInfo) => {
    const hide = message.loading(formatMessage({ id: 'pages.table.adding', defaultMessage: '正在添加' }));
    try {
      await addUser({ ...fields });
      hide();
      message.success(formatMessage({ id: 'pages.table.addSuccess', defaultMessage: '添加成功' }));
      return true;
    } catch (error) {
      hide();
      message.error(formatMessage({ id: 'pages.table.addFailed', defaultMessage: '添加失败请重试！' }));
      return false;
    }
  };

  /**
   * 更新节点
   * @param fields
   */
  const handleUpdate = async (fields: FormValueType) => {
    const hide = message.loading(formatMessage({ id: 'pages.table.configuring', defaultMessage: '正在配置' }));
    try {
      await modifyUser(
        {
          userId: fields.id || '',
        },
        {
          name: fields.name || '',
          nickName: fields.nickName || '',
          email: fields.email || '',
        },
      );
      hide();

      message.success(formatMessage({ id: 'pages.table.configSuccess', defaultMessage: '配置成功' }));
      return true;
    } catch (error) {
      hide();
      message.error(formatMessage({ id: 'pages.table.configFailed', defaultMessage: '配置失败请重试！' }));
      return false;
    }
  };

  /**
   *  删除节点
   * @param selectedRows
   */
  const handleRemove = async (selectedRows: API.UserInfo[]) => {
    const hide = message.loading(formatMessage({ id: 'pages.table.deleting', defaultMessage: '正在删除' }));
    if (!selectedRows) return true;
    try {
      await deleteUser({
        userId: selectedRows.find((row) => row.id)?.id || '',
      });
      hide();
      message.success(formatMessage({ id: 'pages.table.deleteSuccessRefresh', defaultMessage: '删除成功，即将刷新' }));
      return true;
    } catch (error) {
      hide();
      message.error(formatMessage({ id: 'pages.table.deleteFailed', defaultMessage: '删除失败，请重试' }));
      return false;
    }
  };

  const [createModalVisible, handleModalVisible] = useState<boolean>(false);
  const [updateModalVisible, handleUpdateModalVisible] =
    useState<boolean>(false);
  const [stepFormValues, setStepFormValues] = useState({});
  const actionRef = useRef<ActionType>();
  const [row, setRow] = useState<API.UserInfo>();
  const [selectedRowsState, setSelectedRows] = useState<API.UserInfo[]>([]);
  const columns: ProColumns<API.UserInfo>[] = [
    {
      title: formatMessage({ id: 'pages.table.name', defaultMessage: '名称' }),
      dataIndex: 'name',
      tip: formatMessage({ id: 'pages.table.nameTip', defaultMessage: '名称是唯一的 key' }),
      formItemProps: {
        rules: [
          {
            required: true,
            message: formatMessage({ id: 'pages.table.nameRequired', defaultMessage: '名称为必填项' }),
          },
        ],
      },
    },
    {
      title: formatMessage({ id: 'pages.table.nickname', defaultMessage: '昵称' }),
      dataIndex: 'nickName',
      valueType: 'text',
    },
    {
      title: formatMessage({ id: 'pages.table.gender', defaultMessage: '性别' }),
      dataIndex: 'gender',
      hideInForm: true,
      valueEnum: {
        0: { text: formatMessage({ id: 'pages.table.male', defaultMessage: '男' }), status: 'MALE' },
        1: { text: formatMessage({ id: 'pages.table.female', defaultMessage: '女' }), status: 'FEMALE' },
      },
    },
    {
      title: formatMessage({ id: 'pages.table.operation', defaultMessage: '操作' }),
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => (
        <>
          <a
            onClick={() => {
              handleUpdateModalVisible(true);
              setStepFormValues(record);
            }}
          >
            {formatMessage({ id: 'pages.table.config', defaultMessage: '配置' })}
          </a>
          <Divider type="vertical" />
          <a href="">{formatMessage({ id: 'pages.table.subscribeAlert', defaultMessage: '订阅警报' })}</a>
        </>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: formatMessage({ id: 'pages.table.crudExample', defaultMessage: 'CRUD 示例' }),
      }}
    >
      <ProTable<API.UserInfo>
        headerTitle={formatMessage({ id: 'pages.table.searchTable', defaultMessage: '查询表格' })}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button
            key="1"
            type="primary"
            onClick={() => handleModalVisible(true)}
          >
            {formatMessage({ id: 'pages.table.new', defaultMessage: '新建' })}
          </Button>,
        ]}
        request={async (params, sorter, filter) => {
          const { data, success } = await queryUserList({
            ...params,
            // FIXME: remove @ts-ignore
            // @ts-ignore
            sorter,
            filter,
          });
          return {
            data: data?.list || [],
            success,
          };
        }}
        columns={columns}
        rowSelection={{
          onChange: (_, selectedRows) => setSelectedRows(selectedRows),
        }}
      />
      {selectedRowsState?.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              {formatMessage({ id: 'pages.table.selected', defaultMessage: '已选择' })}{' '}
              <a style={{ fontWeight: 600 }}>{selectedRowsState.length}</a>{' '}
              {formatMessage({ id: 'pages.table.items', defaultMessage: '项' })}&nbsp;&nbsp;
            </div>
          }
        >
          <Button
            onClick={async () => {
              await handleRemove(selectedRowsState);
              setSelectedRows([]);
              actionRef.current?.reloadAndRest?.();
            }}
          >
            {formatMessage({ id: 'pages.table.batchDelete', defaultMessage: '批量删除' })}
          </Button>
          <Button type="primary">{formatMessage({ id: 'pages.table.batchApproval', defaultMessage: '批量审批' })}</Button>
        </FooterToolbar>
      )}
      <CreateForm
        onCancel={() => handleModalVisible(false)}
        modalVisible={createModalVisible}
      >
        <ProTable<API.UserInfo, API.UserInfo>
          onSubmit={async (value) => {
            const success = await handleAdd(value);
            if (success) {
              handleModalVisible(false);
              if (actionRef.current) {
                actionRef.current.reload();
              }
            }
          }}
          rowKey="id"
          type="form"
          columns={columns}
        />
      </CreateForm>
      {stepFormValues && Object.keys(stepFormValues).length ? (
        <UpdateForm
          onSubmit={async (value) => {
            const success = await handleUpdate(value);
            if (success) {
              handleUpdateModalVisible(false);
              setStepFormValues({});
              if (actionRef.current) {
                actionRef.current.reload();
              }
            }
          }}
          onCancel={() => {
            handleUpdateModalVisible(false);
            setStepFormValues({});
          }}
          updateModalVisible={updateModalVisible}
          values={stepFormValues}
        />
      ) : null}

      <Drawer
        width={600}
        open={!!row}
        onClose={() => {
          setRow(undefined);
        }}
        closable={false}
      >
        {row?.name && (
          <ProDescriptions<API.UserInfo>
            column={2}
            title={row?.name}
            request={async () => ({
              data: row || {},
            })}
            params={{
              id: row?.name,
            }}
            columns={columns as ProDescriptionsItemProps<API.UserInfo>[]}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default TableList;
