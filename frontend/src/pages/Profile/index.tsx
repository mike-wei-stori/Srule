import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, message, Spin, Descriptions } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import { useModel, useRequest } from '@umijs/max';
import { useIntl } from '@umijs/max';
import { getProfile, updateProfile } from '@/services/UserController';

const Profile: React.FC = () => {
    const { initialState, setInitialState } = useModel('@@initialState');
    const [form] = Form.useForm();
    const intl = useIntl();

    const { data: currentUser, loading, refresh } = useRequest(getProfile, {
        formatResult: (res) => res?.data
    });

    useEffect(() => {
        if (currentUser) {
            form.setFieldsValue(currentUser);
        }
    }, [currentUser, form]);

    const { run: runUpdate, loading: updateLoading } = useRequest(updateProfile, {
        manual: true,
        onSuccess: () => {
            message.success(intl.formatMessage({ id: 'common.success' }));
            refresh();
        }
    });

    if (loading) {
        return <Spin />;
    }

    return (
        <PageContainer>
            <Card title={intl.formatMessage({ id: 'menu.profile' })}>
                <Descriptions title={intl.formatMessage({ id: 'pages.profile.userInfo' })} bordered column={1} style={{ marginBottom: 24 }}>
                    <Descriptions.Item label={intl.formatMessage({ id: 'pages.login.username' })}>
                        {currentUser?.username}
                    </Descriptions.Item>
                    <Descriptions.Item label={intl.formatMessage({ id: 'pages.profile.nickname' })}>
                        {currentUser?.nickname || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={intl.formatMessage({ id: 'pages.profile.email' })}>
                        {(currentUser as any)?.phone || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={intl.formatMessage({ id: 'pages.profile.phone' })}>
                        {currentUser?.phone || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={intl.formatMessage({ id: 'pages.profile.roles' })}>
                        {currentUser?.roles && currentUser.roles.length > 0
                            ? currentUser.roles.map((role: any) => role.name).join(', ')
                            : intl.formatMessage({ id: 'pages.profile.noRoles' })}
                    </Descriptions.Item>
                </Descriptions>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={runUpdate}
                    initialValues={currentUser}
                >
                    <Form.Item
                        label={intl.formatMessage({ id: 'pages.profile.nickname' })}
                        name="nickname"
                    >
                        <Input placeholder={intl.formatMessage({ id: 'pages.profile.enterNickname' })} />
                    </Form.Item>
                    <Form.Item
                        label={intl.formatMessage({ id: 'pages.profile.email' })}
                        name="email"
                        rules={[{ type: 'email', message: intl.formatMessage({ id: 'pages.profile.validEmail' }) }]}
                    >
                        <Input placeholder={intl.formatMessage({ id: 'pages.profile.enterEmail' })} />
                    </Form.Item>
                    <Form.Item
                        label={intl.formatMessage({ id: 'pages.profile.phone' })}
                        name="phone"
                    >
                        <Input placeholder={intl.formatMessage({ id: 'pages.profile.enterPhone' })} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={updateLoading}>
                            {intl.formatMessage({ id: 'common.save' })}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </PageContainer>
    );
};

export default Profile;
