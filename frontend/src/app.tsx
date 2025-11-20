import React from 'react';
import { history } from '@umijs/max';
import { message, Dropdown } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';

import { getProfile } from '@/services/UserController';

// 初始化状态
export async function getInitialState(): Promise<{
    name?: string;
    currentUser?: {
        id?: number;
        username?: string;
        nickname?: string;
        email?: string;
        avatar?: string;
    };
}> {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await getProfile();
            if (response && response.data) {
                return {
                    name: 'Rule Engine',
                    currentUser: response.data
                };
            }
        } catch (e) {
            console.error('Failed to fetch user info:', e);
        }
    }
    return {
        name: 'Rule Engine'
    };
}

// Layout 配置
export const layout = ({ initialState, setInitialState }: any) => {
    return {
        logo: 'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg',
        title: 'Rule Engine',
        menu: {
            locale: true,
        },
        layout: 'mix',
        navTheme: 'light',
        primaryColor: '#1890ff',
        fixedHeader: false,
        fixSiderbar: true,
        colorWeak: false,
        splitMenus: false,

        // 右上角头像配置
        avatarProps: {
            src: initialState?.currentUser?.avatar || 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
            title: initialState?.currentUser?.nickname || initialState?.currentUser?.username || '未登录',
            size: 'small',
            render: (props: any, dom: React.ReactNode) => {
                if (!initialState?.currentUser) {
                    return dom;
                }

                return (
                    <Dropdown
                        menu={{
                            items: [
                                {
                                    key: 'profile',
                                    icon: <UserOutlined />,
                                    label: '个人中心',
                                    onClick: () => {
                                        history.push('/profile');
                                    },
                                },
                                {
                                    type: 'divider',
                                },
                                {
                                    key: 'logout',
                                    icon: <LogoutOutlined />,
                                    label: '退出登录',
                                    danger: true,
                                    onClick: () => {
                                        localStorage.removeItem('token');
                                        setInitialState((s: any) => ({ ...s, currentUser: undefined }));
                                        message.success('已退出登录');
                                        history.push('/login');
                                    },
                                },
                            ],
                        }}
                    >
                        {dom}
                    </Dropdown>
                );
            },
        },

        // 页脚配置
        footerRender: () => {
            return (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div>Rule Engine © 2024</div>
                </div>
            );
        },

        // 菜单头配置
        menuHeaderRender: undefined,

        // 未登录时的处理
        onPageChange: () => {
            const { location } = history;
            const token = localStorage.getItem('token');

            // 如果没有登录且不在登录页面，跳转到登录页
            if (!token && location.pathname !== '/login' && location.pathname !== '/oauth/callback') {
                history.push('/login');
            }
        },
    };
};

// 请求配置
export const request = {
    timeout: 10000,
    errorConfig: {
        errorHandler: (error: any) => {
            const { response } = error;
            if (response && response.status) {
                const { status, data } = response;

                if (status === 401) {
                    message.error('未登录或登录已过期，请重新登录');
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                } else if (status === 403) {
                    message.error('权限不足：您没有访问此资源的权限');
                } else {
                    const errorText = data?.message || '请求错误';
                    message.error(errorText);
                }
            } else if (!response) {
                message.error('网络异常，请检查您的网络连接');
            }
            throw error;
        },
    },
    requestInterceptors: [
        (url: string, options: any) => {
            const token = localStorage.getItem('token');
            if (token) {
                const headers = {
                    ...options.headers,
                    Authorization: `Bearer ${token}`,
                };
                return {
                    url,
                    options: { ...options, headers },
                };
            }
            return { url, options };
        },
    ],
    responseInterceptors: [
        (response: any) => {
            const { data } = response;
            // Handle unified backend response structure
            if (data && typeof data === 'object' && 'code' in data) {
                if (data.code === 200) {
                    return response;
                } else if (data.code === 403) {
                    message.error('权限不足：您没有访问此资源的权限');
                    throw new Error(data.message);
                } else if (data.code === 401) {
                    message.error('未登录或登录已过期');
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    throw new Error(data.message);
                } else {
                    message.error(data.message || '操作失败');
                    throw new Error(data.message);
                }
            }
            return response;
        },
    ],
};
