import React from 'react';
import { Button, Card, Typography, Form, Input, message, Divider, Tabs } from 'antd';
import { GoogleOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { history, useIntl, useRequest } from '@umijs/max';
import { login, register } from '@/services/AuthController';

const { Title } = Typography;

const Login: React.FC = () => {
  const intl = useIntl();

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  };

  const { run: runLogin, loading: loginLoading } = useRequest(login, {
    manual: true,
    onSuccess: (res) => {
      if (res) {
        const token = res.token;
        if (token) {
          localStorage.setItem('token', token);
          message.success(intl.formatMessage({ id: 'common.success' }));
          history.push('/features');
        }
      }
    },
  });

  const { run: runRegister, loading: registerLoading } = useRequest(register, {
    manual: true,
    onSuccess: (res) => {
      if (res) {
        message.success(intl.formatMessage({ id: 'common.success' }));
      }
    },
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 450, textAlign: 'center' }}>
        <Title level={2}>Rule Engine System</Title>

        <Tabs
          defaultActiveKey="login"
          items={[
            {
              key: 'login',
              label: intl.formatMessage({ id: 'menu.login' }),
              children: (
                <Form onFinish={runLogin}>
                  <Form.Item
                    name="username"
                    rules={[{ required: true, message: 'Please input your Username!' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder={intl.formatMessage({ id: 'pages.login.username' })} />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: 'Please input your Password!' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder={intl.formatMessage({ id: 'pages.login.password' })} />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loginLoading} block>
                      {intl.formatMessage({ id: 'pages.login.submit' })}
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'register',
              label: intl.formatMessage({ id: 'menu.register' }),
              children: (
                <Form onFinish={runRegister}>
                  <Form.Item
                    name="username"
                    rules={[{ required: true, message: 'Please input your Username!' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder={intl.formatMessage({ id: 'pages.login.username' })} />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: 'Please input your Password!' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder={intl.formatMessage({ id: 'pages.login.password' })} />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    rules={[{ type: 'email' }]}
                  >
                    <Input placeholder={intl.formatMessage({ id: 'pages.profile.email' })} />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={registerLoading} block>
                      {intl.formatMessage({ id: 'menu.register' })}
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />

        <Divider>OR</Divider>

        <Button
          icon={<GoogleOutlined />}
          onClick={handleGoogleLogin}
          block
          size="large"
        >
          {intl.formatMessage({ id: 'pages.login.googleLogin' })}
        </Button>
      </Card>
    </div>
  );
};

export default Login;
